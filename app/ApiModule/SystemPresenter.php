<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;

class SystemPresenter extends BasePresenter {

    /**
     * @inject
     * @var \Nette\Database\Context
     */
    public $database;

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

        $repository = $this->system->getDriveInfo('repository');
        $data['repository']['size'] = $repository->size;
        $data['repository']['used'] = $repository->used;
        $data['repository']['available'] = $repository->available;
        $data['repository']['percent'] = $repository->percent;

        $data['services'] = [];
        array_push($data['services'], [
            'label' => 'MiniDLNA',
            'name' => 'minidlna',
            'running' => $this->system->getServiceStatus('minidlna')
        ]);
        array_push($data['services'], [
            'label' => 'Samba',
            'name' => 'smbd',
            'running' => $this->system->getServiceStatus('smbd')
        ]);
        array_push($data['services'], [
            'label' => 'Supervisor',
            'name' => 'supervisor',
            'running' => $this->system->getServiceStatus('supervisor')
        ]);

        $dwnlStatus = false;
        if (shell_exec('ps ax | grep -v grep | grep -v grep | grep node\ /var/www/appDownload/download.js')) {
            $dwnlStatus = true;
        }
        array_push($data['services'], [
            'label' => 'Download',
            'name' => 'download',
            'running' => $dwnlStatus
        ]);

        $iotStatus = false;
        if (shell_exec('ps ax | grep -v grep | grep -v grep | grep node\ /var/www/IOTGateway/IOTGateway.js')) {
            $iotStatus = true;
        }
        array_push($data['services'], [
            'label' => 'IOT Gateway',
            'name' => 'iotgateway',
            'running' => $iotStatus
        ]);

        $bleStatus = false;
        if (shell_exec('ps ax | grep -v grep | grep -v grep | grep node\ /var/www/IOTGateway/BLEGateway.js')) {
            $bleStatus = true;
        }
        array_push($data['services'], [
            'label' => 'BLE Gateway',
            'name' => 'blegateway',
            'running' => $bleStatus
        ]);

        $this->resource->status = $data;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method PUT
     */
    public function validateServiceCommand() {
        $this->getInput()->field('name')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: name");
        $this->getInput()->field('command')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: command");
    }

    /**
     * @method PUT
     */
    public function actionServiceCommand($type = 'json') {

        if ($this->getInput()->name === "download" || $this->getInput()->name === "iotgateway" || $this->getInput()->name === "blegateway") {
            $result = shell_exec('sudo /usr/bin/supervisorctl ' . $this->getInput()->command . ' ' . $this->getInput()->name);
            if ($this->getInput()->command === 'start') {
                if (strpos($result, 'started') !== false) {
                    $this->resource->status = 'success';
                } else {
                    $this->resource->status = 'failed';
                }
            } else if ($this->getInput()->command === 'stop') {
                if (strpos($result, 'stopped') !== false) {
                    $this->resource->status = 'success';
                } else {
                    $this->resource->status = 'failed';
                }
            } else {
                $this->resource->status = 'failed';
            }
        } else {
            $result = shell_exec('sudo /etc/init.d/' . $this->getInput()->name . ' ' . $this->getInput()->command);
            if ($result != null) {
                if (strpos($result, 'failed') !== false) {
                    $this->resource->status = 'failed';
                } else {
                    $this->resource->status = 'success';
                }
            } else {
                $this->resource->status = 'failed';
            }
        }

        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method POST
     */
    public function actionSystemShutdown($type = 'json') {
        shell_exec('sudo /sbin/shutdown');
        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method POST
     */
    public function actionSystemReboot($type = 'json') {
        shell_exec('sudo /sbin/shutdown -r +1');
        $this->resource->status = 'success';
        $this->sendResource($this->typeMap[$type]);
    }

}
