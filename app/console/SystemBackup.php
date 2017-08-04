<?php

namespace App\Console;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use DateTime;

class SystemBackup extends Command {

    /**
     * @inject
     * @var \Nette\Database\Context 
     */
    public $database;

    /**
     * @inject
     * @var \App\Lib\Download
     */
    public $download;

    /**
     * @inject
     * @var \App\Lib\Backup
     */
    public $backup;

    /**
     * @inject
     * @var \Tracy\ILogger
     */
    public $logger;

    protected function configure() {
        $this->setName('backup:system');
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $start = new DateTime();

        // rename last backup
        shell_exec('mv /backups/System/system_backup.img /backups/System/old_system_backup.img');
        
        $backup = $this->database->table('backups')->insert([
            'directory' => 'Systém',
            'status' => $this->backup->getStatusId('running'),
            'started_at' => $start
        ]);

        $status = json_encode([
                    'directory' => $backup->directory,
                    'status' => $this->backup->getStatusName($backup->status),
                    'started_at' => $start->format('Y-m-d H:i:s')
                ]) . "\n";

        $this->logger->log($status, 'backup_log');

        $output->write($status);

        $cmd = shell_exec('dd if=/dev/sda1 of=/backups/System/system_backup.img 2>&1');

        $end = new DateTime();
        
        $totalSize = $this->backup->getBackupSize($cmd);

        $statusId = 0;
        if ($this->backup->isCompleted($cmd, true)) {
            // detete old backup
            shell_exec('rm /backups/System/old_system_backup.img');
            
            $statusId = $this->backup->getStatusId('completed');

            $this->database->table('backups')->where('id', $backup->id)->update([
                'status' => $statusId,
                'total_size' => $totalSize,
                'finished_at' => $end,
                'time' => $this->download->time_convert($end->getTimestamp() - $start->getTimestamp())
            ]);
        } else {
            $statusId = $this->backup->getStatusId('failed');

            $this->database->table('backups')->where('id', $backup->id)->update([
                'status' => $statusId,
                'finished_at' => $end,
                'time' => $this->download->time_convert($end->getTimestamp() - $start->getTimestamp())
            ]);
        }

        $status = json_encode([
                    'status' => $this->backup->getStatusName($statusId),
                    'finished_at' => $end->format('Y-m-d H:i:s')
                ]) . "\n";

        $this->logger->log($status, 'backup_log');

        $output->write($status);
    }

}
