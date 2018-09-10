"""

"""

import turtle


def drow(points, color, my_turtle):
    my_turtle.fillcolor(color)
    my_turtle.up()
    my_turtle.goto(points[0][0], points[0][1])
    my_turtle.down()
    my_turtle.begin_fill()
    my_turtle.goto(points[1][0], points[1][1])
    my_turtle.goto(points[2][0], points[2][1])
    my_turtle.goto(points[0][0], points[0][1])
    myTurtle.end_fill()


def get_mid_points(p1, p2):
    return [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]


def sierpinski(points, degree, my_turtle):
    colormap = ["blue", "red", "orange", "yellow", "white", "green", "violet"]
    drow(points, colormap[degree], my_turtle)
    if degree > 0:
        sierpinski([points[0],
                    get_mid_points(points[0], points[1]),
                    get_mid_points(points[0], points[2])], degree-1, my_turtle)
        sierpinski([points[1],
                    get_mid_points(points[0], points[1]),
                    get_mid_points(points[1], points[2])], degree-1, my_turtle)
        sierpinski([points[2],
                    get_mid_points(points[2], points[1]),
                    get_mid_points(points[0], points[2])], degree-1, my_turtle)


if __name__ == "__main__":
    myTurtle = turtle.Turtle()
    myWin = turtle.Screen()
    myPoints = [[-100, -50], [0, 100], [100, -50]]
    sierpinski(myPoints, 3, myTurtle)
    myWin.exitonclick()
