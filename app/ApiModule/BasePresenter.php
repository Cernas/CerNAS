<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Application\UI\ResourcePresenter;
use Drahak\Restful\IResource;
use Tracy\ILogger;

abstract class BasePresenter extends ResourcePresenter {

    /**
     * Acceptable REST responses
     * @var array
     */
    protected $typeMap = array(
        'json' => IResource::JSON,
        'xml' => IResource::XML
    );
    
    /**
     * @var ILogger 
     */
    private $logger;

    /**
     * Get main logger from DIC
     * @param ILogger $logger
     */
    public function injectLogger(ILogger $logger) {
        $this->logger = $logger;
    }

    public function startup() {
        parent::startup();
    }

    /**
     * 
     * @return ILogger
     */
    public function getLogger() {
        return $this->logger;
    }
}
