"use strict";

const YAML = require("js-yaml");
const FS = require("fs");
const Ruuvi = require("node-ruuvitag");
const Influx = require("influx");

var config = YAML.safeLoad(FS.readFileSync("config.yml", "utf-8"));

const influx = new Influx.InfluxDB({
    host: config.influx.host,
    database: config.influx.database,
    schema: [
        {
            measurement: "meta",
            fields: {
                rssi: Influx.FieldType.INTEGER,
                battery: Influx.FieldType.INTEGER,
            },
            tags: [
                "id",
                "label",
            ],
        },
        {
            measurement: "accel",
            fields: {
                x: Influx.FieldType.INTEGER,
                y: Influx.FieldType.INTEGER,
                z: Influx.FieldType.INTEGER,
            },
            tags: [
                "id",
                "label",
            ],
        },
        {
            measurement: "atmosphere",
            fields: {
                humidity: Influx.FieldType.FLOAT,
                temperature: Influx.FieldType.FLOAT,
                pressure: Influx.FieldType.INTEGER,
            },
            tags: [
                "id",
                "label",
            ],
        },
    ]
})


Ruuvi.on("found", function(tag) {
    var id = tag.id;
    
    var label = "unknown"
    if (config.devices[id]) {
        label = config.devices[id].label;
    }

    console.log("found %s (%s)", id, label);
    
    tag.on("updated", function(data) {
        console.log("Got data from %s (%s):", id, label, data);
        
        var tags = {
            id: id,
            label: label,
        };
        
        influx.writePoints([
            {
                measurement: "meta",
                tags: tags,
                fields: {
                    rssi: data.rssi,
                    battery: data.battery,
                },
            },
            {
                measurement: "accel",
                tags: tags,
                fields: {
                    x: data.accelerationX,
                    y: data.accelerationY,
                    z: data.accelerationZ,
                },
            },
            {
                measurement: "atmosphere",
                tags: tags,
                fields: {
                    humidity: data.humidity,
                    temperature: data.temperature,
                    pressure: data.pressure,
                },
            },
        ]);
    });
});
