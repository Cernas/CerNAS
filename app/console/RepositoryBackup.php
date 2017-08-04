<?php

namespace App\Console;

use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use DateTime;

class RepositoryBackup extends Command {

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
        $this->setName('backup:repository');
    }

    protected function execute(InputInterface $input, OutputInterface $output) {

        $directories = $this->database->table('backup_directories');

        foreach ($directories as $directory) {
            $start = new DateTime();

            $backup = $this->database->table('backups')->insert([
                'directory' => trim(strrchr($directory->path, '/'), '/'),
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

            $cmd = shell_exec('duplicity --no-encryption /repository' . $directory->path . ' file:///backups/' . $backup->directory);

            $end = new DateTime();
            
            $totalSize = $this->backup->getResultParam($cmd, 'SourceFileSize');
            $changedSize = $this->backup->getResultParam($cmd, 'NewFileSize');

            $statusId = 0;
            if ($this->backup->isCompleted($cmd, false)) {
                $statusId = $this->backup->getStatusId('completed');

                $this->database->table('backups')->where('id', $backup->id)->update([
                    'status' => $statusId,
                    'total_size' => $totalSize,
                    'changed_size' => $changedSize,
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

}
