<?php

namespace App;

use Nette;
use Nette\Application\Routers\RouteList;
use Drahak\Restful\Application\IResourceRouter;
use Drahak\Restful\Application\Routes\CrudRoute;
use Nette\Application\Routers\Route;
use Drahak\Restful\Application\Routes\ResourceRoute;

class RouterFactory {

    use Nette\StaticClass;

    /**
     * @return Nette\Application\IRouter
     */
    public static function createRouter() {
        $router = new RouteList;

        /* Download */
        $router[] = new ResourceRoute('api/v1/download/add', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'add'), IResourceRouter::POST);

        $router[] = new ResourceRoute('api/v1/download/remove-failed', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'removeFailed'), IResourceRouter::DELETE);

        $router[] = new ResourceRoute('api/v1/download/list', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'list'), IResourceRouter::GET);

        $router[] = new ResourceRoute('api/v1/download/cancel', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'cancel'), IResourceRouter::DELETE);

        $router[] = new ResourceRoute('api/v1/download/delete', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'delete'), IResourceRouter::DELETE);

        $router[] = new ResourceRoute('api/v1/download/update-status', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'UpdateStatus'), IResourceRouter::PUT);

        $router[] = new ResourceRoute('api/v1/download/is-exist', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'IsExist'), IResourceRouter::GET);

        $router[] = new ResourceRoute('api/v1/download/set-hidden', array(
            'module' => 'Api',
            'presenter' => 'Download',
            'action' => 'SetHidden'), IResourceRouter::PUT);

        /* System */
        $router[] = new ResourceRoute('api/v1/system/status', array(
            'module' => 'Api',
            'presenter' => 'System',
            'action' => 'status'), IResourceRouter::GET);

        $router[] = new ResourceRoute('api/v1/system/service-command', array(
            'module' => 'Api',
            'presenter' => 'System',
            'action' => 'ServiceCommand'), IResourceRouter::PUT);

        $router[] = new ResourceRoute('api/v1/system/shutdown', array(
            'module' => 'Api',
            'presenter' => 'System',
            'action' => 'SystemShutdown'), IResourceRouter::POST);

        $router[] = new ResourceRoute('api/v1/system/reboot', array(
            'module' => 'Api',
            'presenter' => 'System',
            'action' => 'SystemReboot'), IResourceRouter::POST);

        /* Directoty */
        $router[] = new ResourceRoute('api/v1/directory/list', array(
            'module' => 'Api',
            'presenter' => 'Directory',
            'action' => 'list'), IResourceRouter::GET);

        /* Backup */
        $router[] = new ResourceRoute('api/v1/backup/status', array(
            'module' => 'Api',
            'presenter' => 'Backup',
            'action' => 'status'), IResourceRouter::GET);

        $router[] = new ResourceRoute('api/v1/backup/add', array(
            'module' => 'Api',
            'presenter' => 'Backup',
            'action' => 'add'), IResourceRouter::POST);

        $router[] = new ResourceRoute('api/v1/backup/remove', array(
            'module' => 'Api',
            'presenter' => 'Backup',
            'action' => 'remove'), IResourceRouter::DELETE);
        
        /* Devices */
        $router[] = new ResourceRoute('api/v1/device-render', array(
            'module' => 'Api',
            'presenter' => 'Device',
            'action' => 'render'), IResourceRouter::GET);

        /* Default */
        $router[] = new CrudRoute('api/v1/<presenter>[/<id>[/<relation>[/<relationId>]]]', array(
            'module' => 'Api',
            'presenter' => 'Default',
            'action' => array(
                IResourceRouter::GET => 'read<Relation>',
                IResourceRouter::POST => 'create<Relation>',
                IResourceRouter::PUT => 'update<Relation>',
                IResourceRouter::DELETE => 'delete<Relation>'
            )
                ), IResourceRouter::GET | IResourceRouter::POST | IResourceRouter::PUT | IResourceRouter::DELETE);

        $router[] = new Route('<presenter>/<action>[/<id>]', 'Homepage:default');

        return $router;
    }

}
