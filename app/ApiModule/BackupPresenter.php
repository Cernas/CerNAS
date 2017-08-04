<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;

class BackupPresenter extends BasePresenter {

    /**
     * @inject
     * @var \Nette\Database\Context
     */
    public $database;

    /**
     * @inject
     * @var \App\Lib\Backup
     */
    public $backup;

    /**
     * @inject
     * @var \App\Lib\System
     */
    public $system;

    /**
     * @method GET
     */
    public function actionStatus($type = 'json') {

        $data = [];
        $backup = $this->system->getDriveInfo('backups');
        $data['drive']['size'] = $backup->size;
        $data['drive']['used'] = $backup->used;
        $data['drive']['available'] = $backup->available;
        $data['drive']['percent'] = $backup->percent;
        $data['backups'] = [];

        $directories = $this->database->table('backups')->select('DISTINCT directory');

        foreach ($directories as $directory) {
            $backup = $this->database->table('backups')->where('directory', $directory->directory)->order('started_at DESC')->limit(1)->fetch();

            $body = [];
            switch ($this->backup->getStatusName($backup->status)) {
                case 'completed':
                    $body['status'] = $this->backup->getStatusName($backup->status);
                    $body['directory'] = $backup->directory;
                    $body['started_at'] = $backup->started_at->format("d. m. Y H:i:s");
                    $body['finished_at'] = $backup->finished_at->format("d. m. Y H:i:s");
                    $body['total_size'] = $backup->total_size;
                    $body['changed_size'] = $backup->changed_size;
                    $body['time'] = $backup->time;
                    array_push($data['backups'], $body);
                    break;

                case 'failed':
                    $body['status'] = $this->backup->getStatusName($backup->status);
                    $body['directory'] = $backup->directory;
                    $body['started_at'] = $backup->started_at->format("d. m. Y H:i:s");
                    array_push($data['backups'], $body);
                    break;
            }
        }

        $body = [];
        $data['directories'] = [];
        $directories = $this->database->table('backup_directories');

        foreach ($directories as $directory) {
            $body['id'] = $directory->id;
            $body['path'] = $directory->path;
            array_push($data['directories'], $body);
        }

        $this->resource->status = $data;
        $this->sendResource($this->typeMap[$type]);
    }

    /*
     * @method POST
     */

    public function validateAdd() {
        $this->getInput()->field('path')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: path");
    }

    /*
     * @method POST
     */

    public function actionAdd($type = 'json') {
        $path = $this->database->table('backup_directories')->insert([
            'path' => $this->getInput()->path
        ]);

        $this->resource->id = $path->id;
        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

    /*
     * @method DELETE
     */

    public function validateRemove() {
        $this->getInput()->field('id')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: id");
    }

    /*
     * @method DELETE
     */

    public function actionRemove($type = 'json') {
        $this->database->table('backup_directories')->where('id', $this->getInput()->id)->delete();

        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

}
