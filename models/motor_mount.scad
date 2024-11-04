// Motor Mount
motor_width=42.3;
shaft_diam=25;
bolthole_dist=31.0;

thickness=4;

/* [Hidden] */
$fn=100;

module sequentialHull(){
    for (i = [0: $children-2])
        hull(){
            children(i);
            children(i+1);
        }
}


difference() {
    sequentialHull() {
        linear_extrude(height=thickness, center=true)
        circle(d=motor_width*1.25);

        translate([0,motor_width/2+1,0])
        cube([motor_width,1,thickness], center=true);

        translate([0,44,0])
        cube([12,1,19], center=true);

        translate([0,67.5,0])
        hull() {
            translate([0,0,7]) rotate([0,90,0]) cylinder(h=12, d=5, center=true);
            translate([0,0,-7]) rotate([0,90,0]) cylinder(h=12, d=5, center=true);
        }
    }

    translate([0,65,0]) cube([8,22,25], center=true);
    translate([0,54,0]) cylinder(h=25,d=8,center=true);

    translate([0,63.5,0]) rotate([0,90,0]) cylinder(h=20, d=3.8, center=true);

    cylinder(thickness*2, d=shaft_diam, center=true);
    for (x=[-1,1]) {
        for (y=[-1,1]) {
            translate(bolthole_dist/2*[x,y]) {
                cylinder(thickness*2, d=3.5, center=true);
                translate([0,0,1.5]) cylinder(thickness, d=8, center=true);
            }
        }
    }
}

/*
linear_extrude(height=10, twist=90, scale=[1, 0.5])
square([8, 2], center=true);
*/

