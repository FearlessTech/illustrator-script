# illustrator-script
illustrator script

Setup:
Define Constant: SegmentLength=1

Step 1:
-Verify that selection contains:
	1) Only closed paths
	2) All the same color stroke
	3) No fill
	4) All the same stroke width

-If not, display error message, make each path red color if error, return


Step 2:
-Move selection into new layer called "CLOSED DIE LINES (WORKING FILE)"
-Copy selection into new layer called “OPEN DIE LINES (FOR PRINT)”
-Change stroke color of all paths in layer "CLOSED DIE LINES (WORKING FILE)" to ORANGE
-Lock and make invisible layer "CLOSED DIE LINES (WORKING FILE)"

Step 3:
-Work on EACH path in layer “OPEN DIE LINES (FOR PRINT)”:
-Find CENTER of path (X & Y coord exactly between left side, right side, top and bottom)
-Find point on path that is FURTHEST POINT away from center.
	(Idea to accomplish this: 
	-Look at: https://design.tutsplus.com/articles/20-free-and-useful-adobe-illustrator-scripts--vector-3849
	-Find script called "Divide (length)"
	-Use this method to create 25 points per segment, then check every point in path for distance from CENTER.
	-Record X and Y for FURTHEST POINT, undo changes, then check if there is a point at these coord.
	-If not, add one point there.
-Break (cut path at anchor point) curve at FURTHEST POINT.

Step 4
-create new line segment, connected at Path Start, length of SegmentLength in mm, angled directly away from CENTER.
-create new line segment, connected at Path END, length of SegmentLength in mm, angled directly away from CENTER.

Step 5
-Display message: "OPEN Die lines layer created.  Please check it carefully BEFORE saving."
