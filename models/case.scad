box = [110, 125, 12];
corner_r = 5;
wall_thickness = 1.5;
bottom_thickness = 1;
post_offset = 5;
screw_size = 2.6;
pi_offs = [20,5];

module cpus() {
  translate([pi_offs.x,pi_offs.y,8.5])
  import("rPi2_01.stl");
  // breadboard
  translate([5, 70, 5])
  cube([82, 55, 10]);
  // motor controllers
  translate([5, 70+55/2-10, 15])
  cube([100, 20, 2]);
}
*cpus();

linear_extrude(box.z)
translate([wall_thickness, wall_thickness])
difference() {
  offset(corner_r) square([box.x, box.y]);
  offset(corner_r-wall_thickness)
  translate([wall_thickness/2, wall_thickness/2])
    square([box.x-wall_thickness, box.y-wall_thickness]);
}

linear_extrude(bottom_thickness)
translate([wall_thickness, wall_thickness])
offset(corner_r) square([box.x, box.y]);

posts=[[23.5,3.5],[81.5,3.5],[23.5,52.5],[81.5,52.5]];
for (p = posts) {
  translate([pi_offs.x+p.x,pi_offs.y+p.y,bottom_thickness]) difference() {
    $fn=50;
    cylinder(h=post_offset, r=2.5);
    cylinder(h=post_offset+1, d=screw_size);
  }
}
