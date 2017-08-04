<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;
use DateTime;

class DownloadPresenter extends BasePresenter {

    /**
     * @inject
     * @var \Nette\Database\Context
     */
    public $database;

    /**
     * @inject
     * @var \App\Rabbitmq\RabbitmqConn
     */
    public $mq;

    /**
     * @inject
     * @var \App\Lib\Download
     */
    public $download;

    /**
     * @method POST
     */
    public function validateAdd() {
        $this->getInput()->field('url')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: url");
        $this->getInput()->field('destination')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: destination");
    }

    /**
     * @method POST
     */
    public function actionAdd($type = 'json') {

        // insert download to database
        $download = $this->database->table('downloads')->insert([
            'url' => $this->getInput()->url,
            'filename' => $this->download->getFileName($this->getInput()->url),
            'destination' => $this->getInput()->destination,
            'status' => $this->download->getStatusId('waiting'),
            'hidden' => false,
            'created_at' => new DateTime()
        ]);

        // insert message to queue
        $this->mq->addDownload([
            'id' => $download->id,
            'filename' => $download->filename,
            'url' => $this->getInput()->url,
            'destination' => $this->getInput()->destination,
        ]);

        $this->resource->status = "success";
        $this->resource->id = $download->id;
        $this->resource->filename = $download->filename;
        $this->resource->destination = $download->destination;
        $this->resource->created_at = $download->created_at;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method DELETE
     */
    public function actionRemoveFailed($type = 'json') {
        $this->database->table('downloads')->where('status = ?', $this->download->getStatusId('failed'))->delete();

        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method GET
     */
    public function actionList($type = 'json') {

        $downloads = $this->database->table('downloads')->where('status', [
            $this->download->getStatusId('waiting'),
            $this->download->getStatusId('failed'),
            $this->download->getStatusId('completed')
        ])->where('hidden', false);

        $data = [];
        foreach ($downloads as $download) {
            $status = $this->download->getStatusName($download->status);

            switch ($status) {
                case 'waiting':
                    $body = [];
                    $body['status'] = $status;
                    $body['id'] = $download->id;
                    $body['filename'] = $download->filename;
                    $body['destination'] = $download->destination;
                    $body['created_at'] = $download->created_at->format("d. m. Y H:i:s");
                    array_push($data, $body);
                    break;

                case 'failed':
                    $body = [];
                    $body['status'] = $status;
                    $body['id'] = $download->id;
                    $body['filename'] = $download->filename;
                    $body['destination'] = $download->destination;
                    $body['started_at'] = $download->created_at->format("d. m. Y H:i:s");
                    $body['finished_at'] = $download->finished_at->format("d. m. Y H:i:s");
                    array_push($data, $body);
                    break;

                case 'completed':
                    $body = [];
                    $body['status'] = $status;
                    $body['id'] = $download->id;
                    $body['filename'] = $download->filename;
                    $body['destination'] = $download->destination;
                    $body['started_at'] = $download->created_at->format("d. m. Y H:i:s");
                    $body['finished_at'] = $download->finished_at->format("d. m. Y H:i:s");
                    $body['size'] = $download->size;
                    $body['time'] = $download->time;
                    array_push($data, $body);
                    break;
            }
        }

        $this->resource->downloads = $data;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method DELETE
     */
    public function actionCancel($type = 'json') {

        $pid = trim(shell_exec('ps -C wget -o pid='), " \n");
        shell_exec('sudo /bin/kill ' . $pid);

        if ($pid !== "") {
            $this->resource->pid = $pid;
            $this->resource->status = 'success';
        } else {
            $this->resource->status = 'failed';
        }

        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method DELETE
     */
    public function validateDelete() {
        $this->getInput()->field('id')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: id");
    }

    /**
     * @method DELETE
     */
    public function actionDelete($type = 'json') {
        if ($this->database->table('downloads')->where('id', $this->getInput()->id)->where('status', $this->download->getStatusId('waiting'))->fetch()) {
            $this->database->table('downloads')
                    ->where('id', $this->getInput()->id)
                    ->where('status', $this->download->getStatusId('waiting'))
                    ->delete();

            $this->resource->status = 'success';
        } else {
            $this->resource->status = 'failed';
        }

        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method PUT
     */
    public function validateUpdateStatus() {
        $this->getInput()->field('id')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: id");
        $this->getInput()->field('status')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: status");
    }

    /**
     * @method PUT
     */
    public function actionUpdateStatus($type = 'json') {
        $now = new DateTime();

        if ($this->database->table('downloads')->where('id', $this->getInput()->id)->fetch()) {
            switch ($this->getInput()->status) {
                case 'running':
                    $this->database->table('downloads')->where('id = ?', $this->getInput()->id)->update([
                        'status' => $this->download->getStatusId($this->getInput()->status),
                        'started_at' => $now
                    ]);
                    break;
                case 'completed':
                    $this->database->table('downloads')->where('id = ?', $this->getInput()->id)->update([
                        'status' => $this->download->getStatusId($this->getInput()->status),
                        'size' => $this->getInput()->size,
                        'time' => $this->getInput()->time,
                        'finished_at' => $now
                    ]);
                    break;
                case 'failed':
                    $this->database->table('downloads')->where('id = ?', $this->getInput()->id)->update([
                        'status' => $this->download->getStatusId($this->getInput()->status),
                        'finished_at' => $now
                    ]);
                    break;
            }

            $this->resource->status = 'success';
            $this->resource->current_time = $now->format("d. m. Y H:i:s");
        } else {
            $this->resource->status = 'failed';
        }

        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method GET
     */
    public function validateIsExist() {
        $this->getInput()->field('id')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: id");
    }

    /**
     * @method GET
     */
    public function actionIsExist($type = 'json') {
        $this->resource->exist = false;

        if ($this->database->table('downloads')->where('id', $this->getInput()->id)->fetch()) {
            $this->resource->exist = true;
        }

        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method PUT
     */
    public function validateSetHidden() {
        $this->getInput()->field('id')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: id");
    }

    /**
     * @method PUT
     */
    public function actionSetHidden($type = 'json') {
        if ($this->database->table('downloads')->where('id', $this->getInput()->id)->fetch()) {
            $this->database->table('downloads')->where('id', $this->getInput()->id)->where('status', [
                $this->download->getStatusId('completed'),
                $this->download->getStatusId('failed')
            ])->update([
                'hidden' => true
            ]);

            $this->resource->status = 'success';
        } else {
            $this->resource->status = 'failed';
        }

        $this->sendResource($this->typeMap[$type]);
    }

}
