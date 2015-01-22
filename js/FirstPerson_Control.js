/**
 * All rights reserved. Email: root#lyq.me
 * 2014-1-9
 */

var FirstPerson_Control = function ( scale, object, plane, scene, vertex, edge, domElement ) {

    this.object = object;
    this.plane = [plane];
    this.scene = scene;
    this.domElement = ( domElement !== undefined ) ? domElement : document;
    this.width  = this.domElement.offsetWidth;
    this.height = this.domElement.offsetHeight;
    this.left = this.domElement.offsetLeft;
    this.top = this.domElement.offsetTop;
    this.scale = scale;

    this.raycaster = new THREE.Raycaster();

    // API
    this.lock = 0;
    this.clear = 0;
    this.reset = 0;
    this.movementSpeed = this.scale / 2;
    this.rollSpeed = Math.PI / 360;
    this.speedMultiplier = 1.0;

    // varibles
    this.tmpQuaternion = new THREE.Quaternion();
    this.mouseStatus = 0;
    this.clientX_old = 0;
    this.clientY_old = 0;
    this.moveState = { x : 0, y : 0, z: 0};
    this.rotateState = { x_rollLeft: 0, x_rollRight: 0, y_rollLeft: 0, y_rollRight: 0, z_rollLeft: 0, z_rollRight: 0 };
    this.moveVector = new THREE.Vector3( 0, 0, 0 );
    this.rotateVector = new THREE.Vector3( 0, 0, 0 );

    this.vertex = vertex;
    this.edge = edge;
    this.select_point = [];
    this.select_sphere = [];
    this.select_path = [];

    this.keydown = function( event ) {

        switch ( event.keyCode ) {

            case 16: /*shift*/ this.speedMultiplier = 0.2; break;

            case 87: /*W*/ this.rotateState.x_rollRight = 1; break;
            case 83: /*S*/ this.rotateState.x_rollLeft = 1; break;
            case 65: /*A*/ this.rotateState.y_rollRight = 1; break;
            case 68: /*D*/ this.rotateState.y_rollLeft = 1; break;
            case 81: /*Q*/ this.rotateState.z_rollLeft = 1; break;
            case 69: /*E*/ this.rotateState.z_rollRight = 1; break;

        }

        this.updateRotationVector();

    };

    this.keyup = function( event ) {

        switch( event.keyCode ) {

            case 16: /*shift*/ this.speedMultiplier = 1; break;

            case 87: /*W*/ this.rotateState.x_rollRight = 0; break;
            case 83: /*S*/ this.rotateState.x_rollLeft = 0; break;
            case 65: /*A*/ this.rotateState.y_rollRight = 0; break;
            case 68: /*D*/ this.rotateState.y_rollLeft = 0; break;
            case 81: /*Q*/ this.rotateState.z_rollLeft = 0; break;
            case 69: /*E*/ this.rotateState.z_rollRight = 0; break;

            case 76: /*L*/
                this.lock = 1 - this.lock;
                if ( this.lock == 1 ) {

                    console.log( " Screen is locked. " );
                } else {

                    console.log( " Screen is unlocked. " );
                }
                break;

            case 67: /*C*/ this.clear = 1; break;
            case 82: /*R*/ this.reset = 1; break;

        }

        this.updatePoints();
        this.updateRotationVector();
        this.updateReset();

    };

    this.mousedown = function( event ) {

        event.preventDefault();
        event.stopPropagation();

        this.clientX_old = event.clientX;
        this.clientY_old = event.clientY;

        //console.log( event.clientX, event.clientY );

        this.mouseStatus = 1;

        this.updatePoints( event.clientX, event.clientY );

    };

    this.mousemove = function( event ) {

        if ( this.mouseStatus == 1) {

            this.moveState.x = -( event.clientX - this.clientX_old ) / this.width;
            this.moveState.y = ( event.clientY - this.clientY_old ) / this.height;
            this.clientX_old = event.clientX;
            this.clientY_old = event.clientY;

            this.updateMovementVector();

            //console.log( this.moveState, event.clientX, event.clientY );
        }
    };

    this.mouseup = function( event ) {

        event.preventDefault();
        event.stopPropagation();

        this.mouseStatus = 0;

        this.moveState.x = 0;
        this.moveState.y = 0;

        this.updateMovementVector();
    };

    this.mousewheel = function (event) {

        if ( this.mouseStatus == 1 ) return;
        if ( this.domElement !== document ) {

            this.domElement.focus();
        }

        event.preventDefault();
        event.stopPropagation();

        this.moveState.z = event.deltaY / 1200 * this.speedMultiplier;

        this.updateMovementVector();

        this.moveState.z = 0;

    };

    this.DOMMouseScroll = function (event) {

        if ( this.mouseStatus == 1 ) return;
        if ( this.domElement !== document ) {

            this.domElement.focus();
        }

        event.preventDefault();
        event.stopPropagation();

        this.moveState.z = event.detail / 27 * this.speedMultiplier;

        this.updateMovementVector();

        this.moveState.z = 0;

    };

    this.update = function() {

        if ( this.lock == 1 ) return;

        var moveMult = this.movementSpeed * this.speedMultiplier;
        var rotMult = this.rollSpeed * this.speedMultiplier;

        this.object.translateX( this.moveVector.x * moveMult );
        this.object.translateY( this.moveVector.y * moveMult );
        this.object.translateZ( this.moveVector.z * moveMult );
        this.moveVector.x = 0;
        this.moveVector.y = 0;
        this.moveVector.z = 0;

        this.tmpQuaternion.set( this.rotateVector.x * rotMult, this.rotateVector.y * rotMult, this.rotateVector.z * rotMult, 1 ).normalize();
        this.object.quaternion.multiply( this.tmpQuaternion );

        // expose the rotation vector for convenience
        this.object.rotation.setFromQuaternion( this.object.quaternion, this.object.rotation.order );


    };

    this.updateFly = function() {

        if ( this.flyPath.length == 0 ) return;
        
    };

    this.updateMovementVector = function() {

        this.moveVector.x = this.moveState.x;
        this.moveVector.y = this.moveState.y;
        this.moveVector.z = this.moveState.z;

    };

    this.updateRotationVector = function() {

        this.rotateVector.x = (-this.rotateState.x_rollRight + this.rotateState.x_rollLeft);
        this.rotateVector.y = (-this.rotateState.y_rollRight + this.rotateState.y_rollLeft);
        this.rotateVector.z = (-this.rotateState.z_rollRight + this.rotateState.z_rollLeft);

    };

    this.updatePoints = function( clientX, clientY ) {

        if ( this.clear == 1 ) {

            console.log( " Clear selected points. " );

            for ( var i = 0; i < this.select_sphere.length; i++ ) {

                this.scene.remove( this.select_sphere[i] );
            }
            for ( var i = 0; i < this.select_path.length; i++ ) {

                this.scene.remove( this.select_path[i] );
            }
            this.select_point.splice( 0, this.select_point.length );
            this.select_sphere.splice( 0, this.select_sphere.length );
            this.select_path.splice( 0, this.select_path.length );

            this.clear = 0;
            return;

        }

        if ( this.lock == 0 ) return;

        var vector = new THREE.Vector3();
        var x = ( clientX - this.left ) / this.width * 2 - 1;
        var y = -( clientY - this.top ) / this.height * 2 + 1;

        //console.log( left, top, clientX, clientY, this.width, this.height);

        vector.set( x, y, 1 ).unproject( this.object );

        this.raycaster.ray.set( this.object.position, vector.sub(this.object.position).normalize() );

        var intersects = this.raycaster.intersectObjects( this.plane );

        if ( intersects.length > 0 ) {

            var intersect = intersects[0];

            var x = intersect.point.x;
            var y = intersect.point.y;

            console.log( " Selected Point: ", x, y );
            this.select_point.push( { x : x, y : y } );

            var material = new THREE.MeshLambertMaterial( { color : 0x9A22EF } );
            var geometry = new THREE.SphereGeometry( 3, 20, 20 );
            var sphere = new THREE.Mesh( geometry, material );
            sphere.position.set( x, y, 24 );

            this.select_sphere.push( sphere );
            this.scene.add( sphere );

            for ( var i = 1; i < 7; i++ ) {

                sphere = new THREE.Mesh( geometry, material );
                sphere.position.set( x, y, i*3);
                sphere.scale.multiplyScalar(0.2);
                this.select_sphere.push( sphere );
                this.scene.add( sphere );

            }

        }

        if ( this.select_point.length >= 2 ) {

            var path_arr;
            path_arr = this.spfa(
                this.select_point[this.select_point.length-2],
                this.select_point[this.select_point.length-1] );

            for ( var i = 0; i < path_arr.length; i++ ) {

                this.select_path.push( path_arr[i] );
                this.scene.add( path_arr[i] );

            }
        }
    };

    this.updateReset = function () {

        if ( this.reset == 0 ) return;

        console.log( " Reset the view point. " );

        this.object.position.set( 0, 0, scale / 4);
        this.object.rotation.set( 0, 0, 0);
        this.reset = 0;
    };

    this.spfa = function ( st, ed ) {

        var q = [];
        var view = {};
        var dist = {};
        var pa = {};
        var temp_arr = [];

        var inf = 1000000000;

        var min_dist = inf;
        for ( var i = 0; i < this.vertex.length; i++ ) {

            var temp = Math.sqrt( (this.vertex[i].x-st.x)*(this.vertex[i].x-st.x) + (this.vertex[i].y-st.y)*(this.vertex[i].y-st.y) );
            temp_arr.push( temp );
            if ( temp < min_dist ) min_dist = temp;

        }

        var way_dist = min_dist;
        min_dist = min_dist * 1.5;
        var front = 0;
        var rear = 0;

        for ( var i = 0; i < this.vertex.length; i++ ) {

            if ( temp_arr[i] < min_dist) {

                dist[i] = temp_arr[i];
                pa[i] = -1;
                view[i] = rear;
                q.push( i );
                rear++;

            }else {

                dist[i] = inf;
                pa[i] = -2;
                view[i] = -1;
            }

        }

        while ( front < rear ) {

            var p = q[front];
            view[p] = -1;

            for (var i = 0; i < this.edge[p].length; i++) {

                var y = this.edge[p][i].y;
                var w = this.edge[p][i].w;

                if (dist[y] > dist[p] + w) {

                    dist[y] = dist[p] + w;
                    pa[y] = p;
                    if (view[y] == -1) {

                        view[y] = rear;
                        q.push(y);
                        rear++;

                    }
                }
            }

            front++;
        }

        var min_dist = inf;
        for ( var i = 0; i < this.vertex.length; i++ ) {

            temp_arr[i] = Math.sqrt( (this.vertex[i].x-ed.x)*(this.vertex[i].x-ed.x) + (this.vertex[i].y-ed.y)*(this.vertex[i].y-ed.y) );
            if ( temp_arr[i] < min_dist ) min_dist = temp_arr[i];

        }

        way_dist += min_dist;
        min_dist = min_dist * 1.5;

        var ed_index = -1;
        var sum_dist = inf;
        for ( var i = 0; i < this.vertex.length; i++ ) {

            if ( temp_arr[i] < min_dist ) {
                if ( temp_arr[i] + dist[i] < sum_dist ) {

                    sum_dist = temp_arr[i] + dist[i];
                    ed_index = i;
                }
            }
        }

        /*
        console.log( ed_index );
        console.log( q );
        console.log( dist );
        console.log( dist[ed_index] );
        */

        var path;
        var path_arr = [];
        var direct_dist = Math.sqrt( (st.x-ed.x)*(st.x-ed.x) + (st.y-ed.y)*(st.y-ed.y) );

        console.log( " Driving distance: ", sum_dist, " Direct distance: ", direct_dist );


        if ( ed_index == -1 || direct_dist <= way_dist ) {
            path = this.make_path( st, ed );
            path_arr.push( path );

            return path_arr;

        }


        path = this.make_path( this.vertex[ed_index], ed );
        path_arr.push( path );

        var p = ed_index;
        while ( p >= 0  ) {

            if ( pa[p] == -1 || pa[p] == -2 ) {

                var path = this.make_path( st, this.vertex[ p ] );
            }else {

                var path = this.make_path( this.vertex[ pa[p] ], this.vertex[p] );
            }

            path_arr.push( path );
            p = pa[p];

        }

        return path_arr;

    };

    this.make_path = function ( p0, p1 ) {

        var dist = Math.sqrt( (p0.x-p1.x)*(p0.x-p1.x) + (p0.y-p1.y)*(p0.y-p1.y) );
        if (p0.y > p1.y) {

            var bias_y = p0.x - p1.x;

        }else {

            var bias_y = p1.x - p0.x;

        }
        var angle = -Math.asin( bias_y / dist );
        var geometry = new THREE.BoxGeometry( 2, dist-1, 2 );
        var material = new THREE.MeshLambertMaterial( { color : 0xEC21E4 });
        var path = new THREE.Mesh( geometry, material );

        path.position.x = (p0.x + p1.x) / 2;
        path.position.y = (p0.y + p1.y) / 2;
        path.position.z = 24;

        path.rotation.z = angle;

        return path;

    };
    function bind( scope, fn ) {

        return function () {

            fn.apply( scope, arguments );

        };
    }


    this.domElement.addEventListener( 'mousemove', bind( this, this.mousemove ), false );
    this.domElement.addEventListener( 'mousedown', bind( this, this.mousedown ), false );
    window.addEventListener( 'mouseup',   bind( this, this.mouseup ), false );
    this.domElement.addEventListener( 'mousewheel', bind( this, this.mousewheel), false);
    this.domElement.addEventListener( 'DOMMouseScroll', bind( this, this.DOMMouseScroll), false);

    window.addEventListener( 'keydown', bind( this, this.keydown ), false );
    window.addEventListener( 'keyup',   bind( this, this.keyup ), false );

    this.updateMovementVector();
    this.updateRotationVector();

};
