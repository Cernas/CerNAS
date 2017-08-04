<?php

namespace App\Lib;

use Nette\Database\Context;

class Backup {

    /**
     * @var \Nette\Database\Context
     */
    public $database;

    public function __construct(Context $database) {
        $this->database = $database;
    }

    public function getStatusId($name) {
        $row = $this->database->table('backup_status')->where('name', $name)->fetch();
        return $row['id'];
    }

    public function getStatusName($id) {
        $row = $this->database->table('backup_status')->where('id', $id)->fetch();
        return $row['name'];
    }

    public function getResultParam($cmd, $name) {
        $substr = substr($cmd, strpos($cmd, $name));
        $param = substr($substr, strpos($substr, '(') + 1, strpos($substr, ')') - strpos($substr, '(') - 1);
        return str_replace("bytes", "B", $param);
    }

    public function isCompleted($cmd, $system) {
        $completed = false;

        if ($system) {
            if ((strpos($cmd, '19529728+0 records in') && strpos($cmd, '19529728+0 records out')) == false) {
                $completed = true;
            }
        } else {
            if (strpos($cmd, 'Errors 0') !== false) {
                $completed = true;
            }
        }

        return $completed;
    }
    
    public function getBackupSize($cmd) {
        $substr = substr($cmd, strpos($cmd, '('));
        $size = substr($substr, strpos($substr, '(') + 1, strpos($substr, ')') - strpos($substr, '(') - 1);
        return $size;
    }

}
