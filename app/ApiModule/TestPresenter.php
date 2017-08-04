<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;

class TestPresenter extends BasePresenter {

    /**
     * @method GET
     */
    public function validateRead() {
        $this->getInput()->field('param')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: param");
    }

    /**
     * @method GET
     */
    public function actionRead($type = 'json') {
        $this->resource->method = "GET";
        $this->resource->param = $this->getInput()->param;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method POST
     */
    public function validateCreate() {
        $this->getInput()->field('param')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: param");
    }

    /**
     * @method POST
     */
    public function actionCreate($type = 'json') {
        $this->resource->method = "POST";
        $this->resource->param = $this->getInput()->param;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method PUT
     */
    public function validateUpdate() {
        $this->getInput()->field('param')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: param");
    }

    /**
     * @method PUT
     */
    public function actionUpdate($type = 'json') {
        $this->resource->method = "PUT";
        $this->resource->param = $this->getInput()->param;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method DELETE
     */
    public function validateDelete() {
        $this->getInput()->field('param')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: param");
    }

    /**
     * @method DELETE
     */
    public function actionDelete($type = 'json') {
        $this->resource->method = "DELETE";
        $this->resource->param = $this->getInput()->param;
        $this->sendResource($this->typeMap[$type]);
    }

}
