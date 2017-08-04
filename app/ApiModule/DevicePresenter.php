<?php

namespace App\ApiModule\Presenters;

use Drahak\Restful\Validation\IValidator;

class DevicePresenter extends BasePresenter {

    /**
     * @inject
     * @var \Nette\Database\Context
     */
    public $database;

    /**
     * @method GET
     */
    public function actionRender($type = 'json') {

        $uniqueRooms = $this->database->table("devices")->select("DISTINCT room");
        $devices["rooms"] = [];
        foreach ($uniqueRooms as $room) {
            array_push($devices["rooms"], [
                "name" => $room->room
            ]);
        }

        $uniqueRooms = $this->database->table("devices")->where("device_group", "lightening")->select("DISTINCT room");
        $devices["lightening"]["rooms"] = [];
        foreach ($uniqueRooms as $room) {
            array_push($devices["lightening"]["rooms"], [
                "name" => $room->room
            ]);
        }


        $lighteningDevices = $this->database->table("devices")->where("device_group", "lightening");
        $devices["lightening"]["devices"] = [];
        foreach ($lighteningDevices as $device) {
            array_push($devices["lightening"]["devices"], [
                "label" => $device->label,
                "room" => $device->room,
                "place" => $device->place,
                "deviceGroup" => $device->device_group,
                "device" => $device->device,
                "connection" => [
                    "protocol" => $device->protocol,
                    "ipAddress" => $device->ip_address,
                    "port" => $device->port
                ],
                "settings" => json_decode($device->settings, true)
            ]);
        }

        $uniqueRooms = $this->database->table("devices")->where("device_group", "sensor")->select("DISTINCT room");
        $devices["sensor"]["rooms"] = [];
        foreach ($uniqueRooms as $room) {
            array_push($devices["sensor"]["rooms"], [
                "name" => $room->room
            ]);
        }

        $sensorDevices = $this->database->table("devices")->where("device_group", "sensor");
        $devices["sensor"]["devices"] = [];
        foreach ($sensorDevices as $device) {
            array_push($devices["sensor"]["devices"], [
                "label" => $device->label,
                "room" => $device->room,
                "place" => $device->place,
                "deviceGroup" => $device->device_group,
                "device" => $device->device,
                "connection" => [
                    "protocol" => $device->protocol,
                    "mac" => $device->mac_address,
                ]
            ]);
        }

        $this->resource = $devices;
        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method PUT
     */
    public function validateUpdate() {
        $this->getInput()->field('topic')->addRule(IValidator::REQUIRED, "Chybí povinný parametr: topic");
    }

    /**
     * @method PUT
     */
    public function actionUpdate($type = 'json') {
        $topic = explode('/', $this->getInput()->topic);

        if ($topic[3] === 'ble_thermometer_ds18b20') {
            $update = [];

            if (isset($this->getInput()->message)) {
                $device = $this->database->table("devices")->where([
                            "room" => $topic[0],
                            "place" => $topic[1],
                            "device_group" => $topic[2],
                            "device" => $topic[3]
                        ])->fetch();

                if ($device->other !== null) {
                    $message = json_decode($this->getInput()->message);
                    $other = json_decode($device->other);
                    if ($message->value->temperature < $other->statistics->minimum) {
                        $other->statistics->minimum = $message->value->temperature;
                        $this->resource->minimum = $message->value->temperature;
                        $this->resource->maximum = $other->statistics->maximum;
                        $this->resource->connected = true;
                        $update = [
                            "other" => json_encode($other),
                            "last_msg" => $this->getInput()->message,
                            "connected" => true,
                            "last_seen" => new \DateTime()
                        ];
                    } else if ($message->value->temperature > $other->statistics->maximum) {
                        $other->statistics->maximum = $message->value->temperature;
                        $this->resource->minimum = $other->statistics->minimum;
                        $this->resource->maximum = $message->value->temperature;
                        $this->resource->connected = true;
                        $update = [
                            "other" => json_encode($other),
                            "last_msg" => $this->getInput()->message,
                            "connected" => true,
                            "last_seen" => new \DateTime()
                        ];
                    } else {
                        $other->statistics->maximum = $message->value->temperature;
                        $this->resource->connected = true;
                        $update = [
                            "last_msg" => $this->getInput()->message,
                            "connected" => true,
                            "last_seen" => new \DateTime()
                        ];
                    }
                } else {
                    $message = json_decode($this->getInput()->message);
                    $this->resource->minimum = $message->value->temperature;
                    $this->resource->maximum = $message->value->temperature;
                    $this->resource->connected = true;
                    $other["statistics"]["minimum"] = $message->value->temperature;
                    $other["statistics"]["maximum"] = $message->value->temperature;
                    $update = [
                        "other" => json_encode($other),
                        "last_msg" => $this->getInput()->message,
                        "connected" => true,
                        "last_seen" => new \DateTime()
                    ];
                }
            } else if (isset($this->getInput()->connected)) {
                $update = [
                    "connected" => $this->getInput()->connected
                ];
            }

            $this->database->table("devices")->where([
                "room" => $topic[0],
                "place" => $topic[1],
                "device_group" => $topic[2],
                "device" => $topic[3]
            ])->update($update);

            $this->resource->status = "success";
        } else {
            $this->resource->status = "failed";
        }

        $this->sendResource($this->typeMap[$type]);
    }

    /**
     * @method GET
     */
    public function actionRead($type = 'json') {
        $devices = null;
        if (isset($this->getInput()->device)) {
            $devices = $this->database->table("devices")->where([
                "device" => $this->getInput()->device
            ]);
        } else {
            $devices = $this->database->table("devices");
        }

        $this->resource = [];
        foreach ($devices as $device) {
            switch ($device->device) {
                case 'wifi_controller_rgb':
                    array_push($this->resource, [
                        "room" => $device->room,
                        "place" => $device->place,
                        "deviceGroup" => $device->device_group,
                        "device" => $device->device,
                        "connection" => [
                            "protocol" => $device->protocol,
                            "ipAddress" => $device->ip_address,
                            "port" => $device->port
                        ],
                        "settings" => [
                            json_decode($device->settings, true)
                        ]
                    ]);
                    break;

                case 'ble_thermometer_ds18b20':
                    array_push($this->resource, [
                        "room" => $device->room,
                        "place" => $device->place,
                        "deviceGroup" => $device->device_group,
                        "device" => $device->device,
                        "connection" => [
                            "protocol" => $device->protocol,
                            "mac" => $device->mac_address
                        ],
                        "lastMsg" => json_decode($device->last_msg),
                        "other" => json_decode($device->other),
                        "connected" => $device->connected,
                        "sampleTimeSec" => 300,
                        "lastSeen" => $device->last_seen
                    ]);
                    break;
            }
        }

        $this->sendResource($this->typeMap[$type]);
    }

}
