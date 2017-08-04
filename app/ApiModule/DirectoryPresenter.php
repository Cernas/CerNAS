<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;

class DirectoryPresenter extends BasePresenter {

    /**
     * @method GET
     */
    public function validateList() {
        $this->getInput()->field('path')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: path");
    }

    /**
     * @method GET
     */
    public function actionList($type = 'json') {

        $output = shell_exec("ls -p " . str_replace(' ', "\ ", $this->getInput()->path) . " | grep \"/\"");
        $names = explode("\n", substr($output, 0, strlen($output) - 1));

        $data = [];
        foreach ($names as $name) {
            $body['name'] = trim($name, '/');
            array_push($data, $body);
        }

        $this->resource->names = $data;
        $this->sendResource($this->typeMap[$type]);
    }

}
