<?php

namespace App\Rabbitmq;

use Kdyby\RabbitMq\Connection;
use PhpAmqpLib\Message\AMQPMessage;
use Nette\Database\Context;
use App\Lib\Download;
use Tracy\ILogger;
use DateTime;

class RabbitmqConn {

    /**
     * @var \Kdyby\RabbitMq\Connection
     */
    public $mqConn;

    /**
     * @var \Nette\Database\Context
     */
    public $database;

    /**
     * @var \App\Lib\Download
     */
    public $download;

    /**
     * @var \Tracy\ILogger
     */
    public $logger;

    public function __construct(Connection $mqConn, Context $database, Download $download, ILogger $logger) {
        $this->mqConn = $mqConn;
        $this->database = $database;
        $this->download = $download;
        $this->logger = $logger;
    }

    public function addDownload($msg) {
        $producer = $this->mqConn->getProducer('download');
        $producer->publish(json_encode($msg));
    }

    public function processDownload(AMQPMessage $message) {
        $data = json_decode($message->body);

        // download exist in db?
        if ($this->database->table('downloads')->where('id', $data->id)->fetch()) {
            $start = new DateTime();

            // update download state to running
            $this->database->table('downloads')->where('id = ?', $data->id)->update([
                'status' => $this->download->getStatusId('running'),
                'started_at' => $start
            ]);

            // create running log
            $status = json_encode([
                        'status' => 'running',
                        'filename' => $this->download->getFileName($data->url),
                        'started_at' => $start->format('Y-m-d H:i:s')
                    ]) . "\n";

            // log running download
            $this->logger->log($status, 'download_log');

            // print running download
            echo $status;

            shell_exec("setsid wget " . $data->url . " -P " . $data->destination . " -o /var/www/temp/downloading_" . $data->id . " /dev/null");

            $end = new DateTime();

            $status = null;
            if ($this->download->isCompleted($data->id)) {
                // update download state to completed
                $status = 'completed';
                $this->database->table('downloads')->where('id = ?', $data->id)->update([
                    'status' => $this->download->getStatusId($status),
                    'size' => $this->download->getSize($data->id),
                    'av_speed' => $this->download->getAvSpeed($data->id),
                    'time' => $this->download->time_convert($end->getTimestamp() - $start->getTimestamp()),
                    'finished_at' => $end
                ]);
            } else {
                // update download state to failed
                $status = 'failed';
                $this->database->table('downloads')->where('id = ?', $data->id)->update([
                    'status' => $this->download->getStatusId($status),
                    'finished_at' => $end
                ]);
            }

            // remove downloading log file
            //shell_exec("rm /var/www/temp/downloading_" . $data->id);
            // create end of download log
            $status = json_encode([
                        'status' => $status,
                        'finished_at' => $end->format('Y-m-d H:i:s')
                    ]) . "\n";

            // log end of download
            $this->logger->log($status, 'download_log');

            // print end of download
            echo $status;
        }
    }

}
