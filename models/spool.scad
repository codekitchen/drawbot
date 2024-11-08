/* [Spool] */
diameter=56;
inner_diameter=48;
width=20;
inner_width=10;
axle_diameter=10.5;

/* [Flange] */
flange_diameter=23;
bolthole_spacing=8.0;
bolthole_diameter=3.1;

module spool() {
    $fn=100;
    difference() {
    // spool body
    union() {
        // inner rim
        cylinder(h=inner_width, d=inner_diameter, center=true);
        // sloping sides
        translate([0,0,(inner_width/2)+(width-inner_width)/4])
            cylinder(h=(width-inner_width)/2, d2=diameter, d1=inner_diameter, center=true);
        translate([0,0,-((inner_width/2)+(width-inner_width)/4)])
            cylinder(h=(width-inner_width)/2, d1=diameter, d2=inner_diameter, center=true);
    }
    // axle hole
    cylinder(h=width*2,d=axle_diameter,center=true);
    // thread hole
    rotate([90,0,0])
    cylinder(h=diameter+2,d=inner_width/4,center=true);
    // flange bed
    translate([0,0,width/2])
    cylinder(h=width-inner_width, d=flange_diameter,center=true);
    // flange bed
    translate([0,0,-width/2])
    cylinder(h=width-inner_width, d=flange_diameter,center=true);
    // screw holes
    rotate(45) // avoid lining up with thread hole
    for (r=[0:3]) {
            rotate(r*90)
            translate([bolthole_spacing,0])
            cylinder(h=width*2, d=bolthole_diameter, center=true);
    }
    }
}

spool();