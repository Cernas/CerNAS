<?php

namespace App\Lib;

class System {

    public function __construct() {
        
    }
    
    public function data_convert($mebibytes) {

        $value = $mebibytes . ' MB';

        if ($value >= 1000) {
            $gibibytes = round($mebibytes / 1024, 1);
            $value = $gibibytes . ' GB';
        }
        
        if ($value >= 1000) {
            $tebibytes = round($gibibytes / 1024, 2);
            $value = $tebibytes . ' TB';
        }

        return $value;
    }
    
    public function getDriveInfo($mountedOn) {
        
        $size = intval(trim(shell_exec('df -B M --output=target,size | grep ' . $mountedOn), "/" . $mountedOn . " M\n"));
        $used = intval(trim(shell_exec('df -B M --output=target,used | grep ' . $mountedOn), "/" . $mountedOn . " M\n"));
        $available = intval(trim(shell_exec('df -B M --output=target,avail | grep ' . $mountedOn), "/" . $mountedOn . " M\n"));
        $percent = intval(trim(shell_exec('df -B M --output=target,pcent | grep ' . $mountedOn), "/" . $mountedOn . " M\n"));
        
        $info = (object) [
            'size' => $this->data_convert($size),
            'used' => $this->data_convert($used),
            'available' => $this->data_convert($available),
            'percent' => $percent
        ];
        
        return $info;
    }
    
    public function getServiceStatus($service) {
        
        $result = false;        
        if (strpos(shell_exec('service ' . $service . ' status'), 'running')) {
            $result = true;
        }
        
        return $result;
    }

}
