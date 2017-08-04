<?php

namespace App\Lib;

use Nette\Database\Context;

class Download {

    /**
     * @var /Nette\Database\Context
     */
    public $database;

    public function __construct(Context $database) {
        $this->database = $database;
    }

    public function getStatusId($name) {
        $row = $this->database->table('download_status')->where('name = ?', $name)->fetch();
        return $row['id'];
    }
    
    public function getStatusName($id) {
        $row = $this->database->table('download_status')->where('id = ?', $id)->fetch();
        return $row['name'];
    }

    public function getFileName($url) {
        $filename = trim(strrchr($url, '/'), '/');
        return $filename;
    }

    public function getSize($id) {
        $text = file_get_contents("/var/www/temp/downloading_" . $id);
        $length = strpos($text, 'Length') + 8;
        $size = intval(substr($text, $length, strpos($text, ' ', $length) - $length));

        return $this->size_convert($size);
    }

    public function getAvSpeed($id) {
        $speed = null;
        $file = "/var/www/temp/downloading_" . $id;
        if (file_exists($file)) {
            $text = file($file);

            for ($i = count($text) - 1; $i >= 0; $i -= 1) {
                if (strpos($text[$i], 'saved')) {
                    $output = $text[$i];
                    $speed = substr($output, strpos($output, '(') + 1, strpos($output, ')') - strpos($output, '(') - 1);
                    break;
                }
            }
        }

        return $speed;
    }
    
    public function size_convert($bytes) {
        $mebibytes = round($bytes / 1048576, 1);        
        $value = $mebibytes . ' MB';
        
        if ($value >= 1000) {
            $gibibytes = round($bytes / 1073384580.44164, 2);
            $value = $gibibytes . ' GB';
        }
        
        return $value;
    }
    
    public function time_convert($seconds) {        
        $value = '';
        $days = intval($seconds / 86400);
        if ($days > 0) {
            $value .= $days . ' d';
        }
        
        $hours = intval(($seconds - ($days * 86400)) / 3600);
        if ($hours > 0) {
            $value .= ' ' . $hours . ' h';
        }
        
        $minutes = intval(($seconds - ($days * 86400) - ($hours * 3600)) / 60);
        if ($minutes > 0) {
            $value .= ' ' . $minutes . ' min';
        }
        
        $seconds = $seconds - ($days * 86400) - ($hours * 3600) - ($minutes * 60);
        if ($seconds > 0) {
            $value .= ' ' . $seconds . ' s';
        } else {
            $value = '0 s';
        }

        return $value;
    }

    public function getCurrentState() {
        $downloading = $this->database->table('downloads')->where('status = ?', $this->getStatusId('running'))->fetch();

        $output = [];
        $file = "/var/www/temp/downloading_" . $downloading['id'];
        if (file_exists($file)) {
            $text = file($file);

            for ($i = count($text) - 1; $i >= 0; $i -= 1) {
                if (strpos($text[$i], "%")) {
                    $percent = intval(substr($text[$i], strpos($text[$i], '%') - 3, 3));
                    $size = intval(substr($text[$i], 0, strpos($text[$i], ' ') - 1));
                    $startParse = trim(substr($text[$i], strpos($text[$i], '%') + 1));
                    $speed = str_replace(strchr($startParse, ' '), '', $startParse);
                    break;
                }
            }

            $output = (object) [
                'percent' => $percent,
                'size' => $this->size_convert($size * 1024),
                'speed' => $speed
            ];
        } else {
            $output['status'] = "error: log file not exist";
        }

        return $output;
    }
    
    public function isCompleted($id) {
        $success = false;
        $file = "/var/www/temp/downloading_" . $id;
        if (file_exists($file)) {
            $text = file($file);

            for ($i = count($text) - 1; $i >= 0; $i -= 1) {
                if (strpos($text[$i], 'saved')) {
                    $success = true;
                    break;
                }
            }
        }

        return $success;
    }

}
