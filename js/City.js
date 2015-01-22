/**
 * All rights reserved. Email: root#lyq.me
 * 2014-1-9
 */

var City = function(scale) {

    var object = this;

    object.scale = scale / 3;

    object.node = [];
    object.hash_table = {};

    object.highway_arr = [];
    object.footway_arr = [];
    object.building_arr = [];
    object.canal_arr = [];
    object.stream_arr = [];
    object.riverbank_arr = [];

    object.highway_name = [];
    object.building_name = [];
    object.footway_name = [];
    object.canal_name = [];
    object.stream_name = [];
    object.riverbank_name = [];

    object.highways = {};
    object.buildings = {};
    object.footways = {};
    object.canals = {};
    object.streams = {};
    object.riverbanks = {};
    object.names = [];

    object.edge = [];
    object.touch_points = [];

    object.get_information = function( filename, callback ) {

        var xmlDoc;
        var xhttp;

        loadXMLDoc( filename, function () {

            if ( xhttp.readyState != 4 )
                return;

            var txt = xhttp.response;
            if ( window.DOMParser ) {

                var parser = new DOMParser();
                xmlDoc = parser.parseFromString( txt, "text/xml" );

            }else { // IE

                xmlDoc = new ActiveXObject( "Microsoft.XMLDOM" );
                xmlDoc.async = false;
                xmlDoc.loadXML( txt);

            }

            var bounds = xmlDoc.getElementsByTagName("bounds")[0];
            var minlat = bounds.getAttribute("minlat");
            var minlon = bounds.getAttribute("minlon");
            var maxlat = bounds.getAttribute("maxlat");
            var maxlon = bounds.getAttribute("maxlon");
            var deltalat = maxlat - minlat;
            var deltalon = maxlon - minlon;

            var node_list = xmlDoc.getElementsByTagName("node");
            for ( var i = 0; i < node_list.length; i++ ) {

                var attribute = {
                    "id": node_list[i].getAttribute("id"),
                    "lon": ((node_list[i].getAttribute("lon") - minlon) / deltalon - 0.5) * object.scale,
                    "lat": ((node_list[i].getAttribute("lat") - minlat) / deltalat - 0.5) * object.scale
                };
                object.node.push( attribute );
                object.hash_table[attribute.id] = i;

            }

            var way_list = xmlDoc.getElementsByTagName("way");
            for ( var i = 0; i < way_list.length; i++ ) {

                var nd_arr = [];
                var node_list = way_list[i].getElementsByTagName("nd");
                for (var j = 0; j < node_list.length; j++) {

                    nd_arr.push(node_list[j].getAttribute("ref"));

                }

                var tag_list = way_list[i].getElementsByTagName("tag");
                var way_attribute = 0;

                for (var j = 0; j < tag_list.length; j++) {

                    var k = tag_list[j].getAttribute("k");
                    if ( way_attribute == 0 && k == "highway" ) {

                        var v = tag_list[j].getAttribute("v");
                        if (v == "primary" || v == "pedestrian" || v == "primary_link" || v =="trunk_link") {

                            object.highway_arr.push(nd_arr);
                            way_attribute = 1;
                        }else {

                            object.footway_arr.push(nd_arr);
                            way_attribute = 2;
                        }

                    } else if ( way_attribute == 0 && k == "building" ) {

                        object.building_arr.push(nd_arr);
                        way_attribute = 3;

                    } else if ( way_attribute == 0 && k == "waterway") {

                        var v = tag_list[j].getAttribute( "v" );
                        if ( v == "canal" || v == "river" ) {

                            object.canal_arr.push(nd_arr);
                            way_attribute = 4;

                        } else if ( v == "stream" ) {

                            object.stream_arr.push(nd_arr);
                            way_attribute = 5;

                        } else if ( v == "riverbank" ) {

                            object.riverbank_arr.push(nd_arr);
                            way_attribute = 6;

                        }
                    }
                }

                if (way_attribute == false) continue;
                var v = "lxy5201314";

                for (var j = 0; j < tag_list.length; j++) {

                    if (tag_list[j].getAttribute("k") == "name") {

                        v = tag_list[j].getAttribute("v");
                        break;

                    }
                }

                switch ( way_attribute) {

                    case 1: object.highway_name.push(v); break;
                    case 2: object.footway_name.push(v); break;
                    case 3: object.building_name.push(v); break;
                    case 4: object.canal_name.push(v); break;
                    case 5: object.stream_name.push(v); break;
                    case 6: object.riverbank_name.push(v); break;

                }
            }

            callback();

        });
        function loadXMLDoc(filename, callback) {

            if (window.XMLHttpRequest) {

                xhttp = new XMLHttpRequest();

            } else {// code for IE5 and IE6

                xhttp = new ActiveXObject("Microsoft.XMLHTTP");

            }

            xhttp.onreadystatechange = callback;
            xhttp.open("GET", filename, true);
            xhttp.send();

        }
    };

    object.city_generator = function(filename, callback) {

        object.get_information(filename, function() {

            use_information();
            callback();

        });
    };

    function use_information() {

        // building
        var buildings_geometry = new THREE.Geometry();

        for (var building_index = 0; building_index < object.building_arr.length; building_index++) {

            var points = [];
            var building_one = object.building_arr[building_index];
            var height = Math.random() * 10 + 2;
            var mid_point = [0, 0];

            for (var i = 0; i < building_one.length; i++) {

                var nd = object.node[object.hash_table[building_one[i]]];
                points.push(new THREE.Vector3(nd.lon, nd.lat, height));
                points.push(new THREE.Vector3(nd.lon, nd.lat, 0));

                mid_point[0] += nd.lon;
                mid_point[1] += nd.lat;

            }

            var geometry = new THREE.ConvexGeometry(points);
            var building = new THREE.Mesh(geometry);
            THREE.GeometryUtils.merge(buildings_geometry, building);

            var text = object.building_name[building_index];
            if ( text == "lxy5201314") continue;

            var name = ObjectText( text, 0x0000ff );
            mid_point[0] /= building_one.length;
            mid_point[1] /= building_one.length;
            name.scale.set( 12, 12, 0.2);
            name.position.set( mid_point[0], mid_point[1], height+0.5 );
            object.names.push( name );

        }
        var material = new THREE.MeshLambertMaterial();

        material.color = {r:252/255, g:218/255, b:221/255};
        object.buildings = new THREE.Mesh(buildings_geometry, material);

        // highway
        var highways_geometry = new THREE.Geometry();
        var exist_point = {};
        var exist_name = {};
        var exist_touch_point = {};
        var exist_edge = {};
        var discrete_point = 0;

        for (var way_index = 0; way_index < object.highway_arr.length; way_index++) {

            var highway_one = object.highway_arr[way_index];
            var mid_point = [-2000, -2000];
            var name_index = highway_one.length / 4;

            if ( exist_touch_point[ highway_one[0] ] == undefined ) {

                exist_touch_point[ highway_one[0] ] = discrete_point++;
                var nd0 = object.node[object.hash_table[highway_one[0]]];
                object.touch_points.push( { x : nd0.lon, y : nd0.lat } );
            }

            for (var i = 1; i < highway_one.length; i++) {

                var nd0 = object.node[object.hash_table[highway_one[i-1]]];
                var nd1 = object.node[object.hash_table[highway_one[i]]];
                var dist = Math.sqrt((nd0.lon-nd1.lon)*(nd0.lon-nd1.lon)+(nd0.lat-nd1.lat)*(nd0.lat-nd1.lat));
                if (nd0.lat > nd1.lat) {

                    var bias_y = nd0.lon - nd1.lon;

                }else {

                    var bias_y = nd1.lon - nd0.lon;

                }
                var angle = -Math.asin(bias_y / dist);
                var geometry = new THREE.BoxGeometry(0.28, dist+0.2, 0.2);
                var highway = new THREE.Mesh(geometry);

                highway.position.x = (nd0.lon + nd1.lon) / 2;
                highway.position.y = (nd0.lat + nd1.lat) / 2;
                highway.position.z = 0;

                highway.rotation.z = angle;

                THREE.GeometryUtils.merge(highways_geometry, highway);

                if ( i > name_index && mid_point[0] == -2000) {

                    var j = object.hash_table[highway_one[i-1]];
                    if ( exist_point[j] == undefined ) {

                        mid_point[0] = nd0.lon;
                        mid_point[1] = nd0.lat;
                        exist_point[j] = 1;

                    }
                }

                var p0 = highway_one[i-1];
                var p1 = highway_one[i];
                if ( exist_touch_point[ p1 ] == undefined ) {

                    exist_touch_point[ p1 ] = discrete_point++;
                    object.touch_points.push( { x : nd1.lon, y : nd1.lat } );
                }

                var q0 = exist_touch_point[p0];
                var q1 = exist_touch_point[p1];

                if ( exist_edge[ q0 ] == undefined ) {

                    exist_edge[ q0 ] = {};
                    object.edge[ q0 ] = [];

                }

                if ( exist_edge[ q1 ] == undefined ) {

                    exist_edge[ q1 ] = {};
                    object.edge[ q1 ] = [];

                }

                if ( exist_edge[ q0 ][ q1 ] == undefined &&
                    exist_edge[ q1 ][ q0 ] == undefined ) {

                    exist_edge[ q0 ][ q1 ] = 1;
                    exist_edge[ q1 ][ q0 ] = 1;
                    object.edge[q0].push( { y: q1, w: dist });
                    object.edge[q1].push( { y: q0, w: dist });
                }

            }

            var text = object.highway_name[way_index];
            if ( text == "lxy5201314" || mid_point[0] == -2000) continue;
            if ( exist_name[text] == undefined ) {

                exist_name[text] = 0;

            } else if ( exist_name[text] < 1) {

                exist_name[text]++;
            } else continue;

            var name = ObjectText( text, 0x0000ff );
            name.scale.set( 18, 18, 0.2);
            name.position.set( mid_point[0], mid_point[1], height+0.1 );
            object.names.push( name );
        }

        var material = new THREE.MeshLambertMaterial();
        material.color = {r:254/255, g:220/255, b:102/255};
        object.highways = new THREE.Mesh(highways_geometry, material);



        // footway
        var footways_geometry = new THREE.Geometry();

        for (var way_index = 0; way_index < object.footway_arr.length; way_index++) {

            var footway_one = object.footway_arr[way_index];
            var mid_point = [-2000, -2000];
            var name_index = footway_one.length / 2;

            if ( exist_touch_point[ footway_one[0] ] == undefined ) {

                exist_touch_point[ footway_one[0] ] = discrete_point++;
                var nd0 = object.node[object.hash_table[footway_one[0]]];
                object.touch_points.push( { x : nd0.lon, y : nd0.lat } );
            }
            
            for (var i = 1; i < footway_one.length; i++) {

                var nd0 = object.node[object.hash_table[footway_one[i-1]]];
                var nd1 = object.node[object.hash_table[footway_one[i]]];
                var dist = Math.sqrt((nd0.lon-nd1.lon)*(nd0.lon-nd1.lon)+(nd0.lat-nd1.lat)*(nd0.lat-nd1.lat));
                if (nd0.lat > nd1.lat) {

                    var bias_y = nd0.lon - nd1.lon;

                }else {

                    var bias_y = nd1.lon - nd0.lon;

                }
                var angle = -Math.asin(bias_y / dist);
                var geometry = new THREE.BoxGeometry(0.18, dist+0.2, 0.2);
                var footway = new THREE.Mesh(geometry);

                footway.position.x = (nd0.lon + nd1.lon) / 2;
                footway.position.y = (nd0.lat + nd1.lat) / 2;
                footway.position.z = 0;

                footway.rotation.z = angle;

                THREE.GeometryUtils.merge(footways_geometry, footway);

                if ( i > name_index && mid_point[0] == -2000) {

                    var j = object.hash_table[footway_one[i-1]];
                    if ( exist_point[j] == undefined ) {

                        mid_point[0] = nd0.lon;
                        mid_point[1] = nd0.lat;
                        exist_point[j] = 1;

                    }
                }

                var p0 = footway_one[i-1];
                var p1 = footway_one[i];
                if ( exist_touch_point[ p1 ] == undefined ) {

                    exist_touch_point[ p1 ] = discrete_point++;
                    object.touch_points.push( { x : nd1.lon, y : nd1.lat } );
                }

                var q0 = exist_touch_point[p0];
                var q1 = exist_touch_point[p1];

                if ( exist_edge[ q0 ] == undefined ) {

                    exist_edge[ q0 ] = {};
                    object.edge[ q0 ] = [];
                }
                if ( exist_edge[ q1 ] == undefined ) {

                    exist_edge[ q1 ] = {};
                    object.edge[ q1 ] = [];
                }
                if ( exist_edge[ q0 ][ q1 ] == undefined &&
                    exist_edge[ q1 ][ q0 ] == undefined ) {

                    exist_edge[ q0 ][ q1 ] = 1;
                    exist_edge[ q1 ][ q0 ] = 1;
                    object.edge[q0].push( { y: q1, w: dist });
                    object.edge[q1].push( { y: q0, w: dist });
                }
            }



            var text = object.footway_name[way_index];
            if ( text == "lxy5201314" || mid_point[0] == -2000) continue;
            if ( exist_name[text] == undefined ) {

                exist_name[text] = 0;

            } else if ( exist_name[text] == 0) {

                exist_name[text] = 1;
            } else continue;

            var name = ObjectText( text, 0x0000ff );
            name.scale.set( 8, 8, 0.2);
            name.position.set( mid_point[0], mid_point[1], height+0.1);
            object.names.push( name );

        }

        var material = new THREE.MeshLambertMaterial();
        material.color = {r:254/255, g:252/255, b:177/255};
        object.footways = new THREE.Mesh(footways_geometry, material);


        // canal
        var canals_geometry = new THREE.Geometry();
        for (var way_index = 0; way_index < object.canal_arr.length; way_index++) {

            var canal_one = object.canal_arr[way_index];
            for (var i = 1; i < canal_one.length; i++) {

                var nd0 = object.node[object.hash_table[canal_one[i-1]]];
                var nd1 = object.node[object.hash_table[canal_one[i]]];
                var dist = Math.sqrt((nd0.lon-nd1.lon)*(nd0.lon-nd1.lon)+(nd0.lat-nd1.lat)*(nd0.lat-nd1.lat));
                if (nd0.lat > nd1.lat) {

                    var bias_y = nd0.lon - nd1.lon;

                }else {

                    var bias_y = nd1.lon - nd0.lon;

                }
                var angle = -Math.asin(bias_y / dist);
                var geometry = new THREE.BoxGeometry(2, dist+1, 0.2);
                var canal = new THREE.Mesh(geometry, material);

                canal.position.x = (nd0.lon + nd1.lon) / 2;
                canal.position.y = (nd0.lat + nd1.lat) / 2;
                canal.position.z = 0;

                canal.rotation.z = angle;

                THREE.GeometryUtils.merge(canals_geometry, canal);

            }
        }

        var material = new THREE.MeshLambertMaterial();
        material.color = {r:37/255, g:158/255, b:226/255};
        object.canals = new THREE.Mesh(canals_geometry, material);


        // stream
        var streams_geometry = new THREE.Geometry();
        for (var way_index = 0; way_index < object.stream_arr.length; way_index++) {

            var stream_one = object.stream_arr[way_index];
            for (var i = 1; i < stream_one.length; i++) {

                var nd0 = object.node[object.hash_table[stream_one[i-1]]];
                var nd1 = object.node[object.hash_table[stream_one[i]]];
                var dist = Math.sqrt((nd0.lon-nd1.lon)*(nd0.lon-nd1.lon)+(nd0.lat-nd1.lat)*(nd0.lat-nd1.lat));
                if (nd0.lat > nd1.lat) {

                    var bias_y = nd0.lon - nd1.lon;

                }else {

                    var bias_y = nd1.lon - nd0.lon;

                }
                var angle = -Math.asin(bias_y / dist);
                var geometry = new THREE.BoxGeometry(1, dist+0.2, 0.2);
                var stream = new THREE.Mesh(geometry, material);

                stream.position.x = (nd0.lon + nd1.lon) / 2;
                stream.position.y = (nd0.lat + nd1.lat) / 2;
                stream.position.z = 0;

                stream.rotation.z = angle;

                THREE.GeometryUtils.merge(streams_geometry, stream);

            }
        }

        var material = new THREE.MeshLambertMaterial();
        material.color = {r:37/255, g:158/255, b:226/255};
        object.streams = new THREE.Mesh(streams_geometry, material);

        // riverbank
        var riverbanks_geometry = new THREE.Geometry();

        for (var riverbank_index = 0; riverbank_index < object.riverbank_arr.length; riverbank_index++) {

            var points = new THREE.Shape();
            var riverbank_one = object.riverbank_arr[riverbank_index];
            var nd = object.node[object.hash_table[riverbank_one[0]]];
            points.moveTo(nd.lon, nd.lat);

            for (var i = 1; i < riverbank_one.length; i++) {

                var nd = object.node[object.hash_table[riverbank_one[i]]];
                points.lineTo(nd.lon, nd.lat);

            }

            var geometry = new THREE.ShapeGeometry(points);
            var riverbank = new THREE.Mesh(geometry);
            riverbank.position.z = 0.1;
            THREE.GeometryUtils.merge(riverbanks_geometry, riverbank);

        }

        var material = new THREE.MeshLambertMaterial();
        material.color = {r:37/255, g:158/255, b:226/255};
        object.riverbanks = new THREE.Mesh(riverbanks_geometry, material);


        function ObjectText( text, color ) {

            var writting_canvas = document.createElement( "canvas" );
            var size = 256; // CHANGED
            writting_canvas.width = size;
            writting_canvas.height = size;
            var context = writting_canvas.getContext( "2d" );
            context.fillStyle = color; // CHANGED
            context.textAlign = "center";
            context.font = "24px Arial";
            context.fillText( text, size / 2, size / 2 );

            var amap = new THREE.Texture(writting_canvas);
            amap.needsUpdate = true;

            var mat = new THREE.SpriteMaterial({
                map: amap,
                transparent: false,
                useScreenCoordinates: false,
                color: 0xffffff // CHANGED
            });

            var sp = new THREE.Sprite(mat);
            return sp;

        }
    }
};

