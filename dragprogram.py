"""Program should read in values of initial velocity, angle from the horizontal,
   the drag coefficient and the interval between each measurement to be plotted.
   the program should then calculate and plot out the trajectory of a projectile"""

#Importing Important Packages
import math as m #math functions
import matplotlib.pyplot as plt #graph plotting
import numpy as np #Just precautionary, used in last checkpoint for arange function
import csv #creating csv files

def initialvar(v0,thet): #Finds x,y,vx and vy at the start of the graph
    nx = 0 #Sets x & y as lists that can be appended to, for graph plotting
    ny = 0.22 #Set to 22cm as that is how high the ball is
    theta = m.radians(thet)#converts into radians, which is required
    vx = v0*m.cos(theta) #creating the initial hor velocity
    vy = v0*m.sin(theta) #creating the initial ver velocity
    return nx,ny,vx,vy #returns initial values

def acceleration(vx,vy,B): #acceleration finding function
    v = m.sqrt(vx**2 + vy**2) #finds magnitude of velocity
    g = 9.81 #set gravity
    ax = (-B)*v*vx #finds x component of acceleration
    ay = ((-B)*v*vy)-g #finds y component of acceleration
    return ax, ay

def step_forward(x,y,vx,vy,ax,ay,delt): #stepping forward to create the new point to plot
    x += (delt*vx) #creates the new point
    y += (delt*vy) #creates the new point
    vx += (delt*ax) #finds the new hor velo
    vy += (delt*ay) #finds the new ver velo
    return x,y,vx,vy #returning the new x and y point to be plotted, as well as the new velocities to be used to find the acceleration.


def main():
    v0 = float(input("Please input the initial velocity: ")) #obtains v0 data from user
    theta = 0 #Setting for gravity lab
    #theta = float(input("Please input the projectile angle from the horizontal in degrees: ")) #obtains theta data from user
    B = float(input("Please input the normalised drag coefficient: ")) #obtains B data from user
    delt = float(input("Please input the step interval in seconds: ")) #obtains delt data from user
    x = [0] #creates the list that will hold the plotted x, nx is the changing value
    y = [0] #creates the list that will hold the plotted y, ny is the changing value
    nx,ny,vx,vy = initialvar(v0,theta) #find initial variables for position and velocity.

    while ny >= 0 : #while y greater than or equal to zero, once below 0, its in the ground
        ax,ay = acceleration(vx,vy,B) # finds acceleration at certain point
        nx,ny,vx,vy = step_forward(nx,ny,vx,vy,ax,ay,delt) #creating the new point to be appended.
        x.append(nx) #adds to list of x and y values
        y.append(ny)

    #write y values to csv file
    with open('yvalues.csv', 'w') as file:
        writer = csv.writer(file, dialect='excel')
        for val in y:
            writer.writerow([val])

    plt.plot(x,y) #plot graph
    plt.title("Projectile Motion")
    plt.xlabel("x axis")
    plt.ylabel("y axis")
    plt.show() #shows graph
    print("The range is " + str(x[-1]) + "m." )
main() #calls main
