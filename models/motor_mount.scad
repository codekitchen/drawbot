// Motor Mount
motor_width=42.3; // NEMA-17 motor width
shaft_diam=25;
bolthole_dist=31.0; // NEMA-17 bolt hole pattern
plate_width=motor_width*1.3;

thickness=4;

use <spool.scad>
use <scad_libs/hulls.scad>

/* [Hidden] */
$fn=100;

difference(){
    // base plate with no holes
    sequentialHull(){
        // plate
        cylinder(d=plate_width, h=thickness);
        // plate edge
        translate([-plate_width/2,plate_width/2])
            cube([plate_width,0.1,thickness]);
        // mount edge
        translate([-mount.x/2,mount_point-mount.y,0])
            cube([mount.x,0.1,mount.z]);
        // mount body
        mount_body();
    }

    // plate holes for shaft and screws
    translate([0,0,-1]) {
        cylinder(d=shaft_diam, h=thickness+2);
        bd=bolthole_dist/2;
        for (x=[-bd,bd],y=[-bd,bd]) {
            translate([x,y]) {
                // screw hole
                cylinder(d=3.5, h=thickness+2);
                // screw head inset
                translate([0,0,2.5]) cylinder(d=8, h=thickness);
            }
        }
    }
    // large groove in mount
    mount_groove();
    // pin hole for suction cup
    mount_pinhole();
}

mount_point=70;
mount = [12,25,25];
mount_rounding_r=4.5;
pin_hole_r = 1.9;
mount_pin = [0,4.5+pin_hole_r,9.5]; // pin hole distance from edges
groove_y=12;
groove_width=8;

// the part that mounts to the suction cup
module mount_body() {
    translate([0,mount_point-mount.y,mount.z/2]) rotate([0,90,0])
    linear_extrude(height=mount.x, center=true) {
        hull() {
            yend=mount.y-mount_rounding_r;
            translate([-mount.z/2,0]) square([mount.z, yend]);

            xoff=mount.z/2-mount_rounding_r;
            for (x=[-xoff,xoff]) {
                translate([x,yend])
                    circle(r=mount_rounding_r);
            }
        }
    }
}

module mount_pinhole() {
    translate([0,mount_point-mount.y,mount.z/2]) rotate([0,90,0])
    linear_extrude(height=mount.x+2, center=true) {
        translate([-(mount.z/2)+mount_pin.z, mount.y-mount_pin.y]) circle(r=pin_hole_r);
    }
}

// the big vertical groove so the suction cup arm can swing back and forth
module mount_groove() {
    translate([0,mount_point-groove_y,mount.z/2])
    linear_extrude(height=mount.z+2, center=true) {
        circle(d=groove_width);
        translate([0,10,0]) square([groove_width,20], center=true);
    }
}

// integration testing, show all the other joined components
*color("silver") {
    motor=[motor_width,motor_width,37];
    suction_cup=[62,62,13.5];

    // motor
    translate([0,0,-motor.z/2]){
        cube(motor,center=true);
        translate([0,0,motor.z/2]) cylinder(d=5,h=22);
    }

    // spool from other file
    translate([0,0,20+thickness])
    spool();

    // suction cup stand-in
    suction_cup_arm=13.5;
    suction_cup_hole=9.5;
    translate([0,mount_point-mount_pin.y,mount.z]) {
        cylinder(d=suction_cup.x,h=suction_cup.z);
        difference() {
            translate([0,0,-suction_cup_arm]) cylinder(d=3,h=suction_cup_arm);
            translate([0,0,-suction_cup_hole]) rotate([0,90,0]) cylinder(d=2, h=10, center=true);
        }
    }
}
