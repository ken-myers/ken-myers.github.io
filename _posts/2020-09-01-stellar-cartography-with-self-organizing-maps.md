---
layout: post
title: "Stellar Cartography With Self Organizing Maps"
slug: starmaps
---



{% include postImage.html imgName = "starmapPretty.png" caption = "Distance optimized map of the 10 closest stars to Earth, Sol included. This one has an average error of around 8.9%." width = "800px" %}


There was something of a family debate over whether a reduced-dimensionality starmap could still be accurate enough as to be useful, so I made a covid-quarantine experiment of it. 


## Process
The idea is pretty simple: create a 2D starmap in which the distances between each star are as accurate as possible.


{% include postImage.html imgName = "starGenDemo.gif" width="525px" caption = "Generation of a map of our 30 nearest stars." %}


I tried to implement something like a [Kohonen map](https://en.wikipedia.org/wiki/Self-organizing_map). I'm not sure if it actually falls under that name, but it does follow the same principles of iteratively changing the position of each node towards a more ideal state, which in this case would be one in which the distances between each pair on the board are most accurate. Here's my algorithm:

- Randomly initialize each item's position.
- Repeat the following n times or until convergence:
	- For each item in the dataset:
		1. Calculate and store the average pairwise error (discrepancy between true distance and distance on the map) between the given item and all other items.
		2. Shift the item's position by a certain increment in both directions on each axis, calculating and storing the item's average error for each possible move. 
		3. Commit the move which yields the lowest error, and move onto the next item.
	- If the average error of the whole map has not changed since last iteration, either
		- Decrease the increment size if the results will still be significant, or otherwise
		- Stop. The map's error has converged.

A few nuances have been glossed over in this overview. You can view the full code on [my Github](https://github.com/ken-myers/stargen).

## Results

One of the principal arguments against the usability of these maps was that "it's like putting cities in a line." I made sure to generalize my code for data of any dimension and fed it the largest 20 cities in Texas. If you're from around here, I think you'd agree with me that this map looks like it'd be helpful to any one-dimensional creatures attempting to traverse the state.

{% include postImage.html scrollable=true imgName = "linearCities.png" caption = "The 20 largest cities in Texas plotted linearly, optimized for distance. (The Metroplex is a bit clustered, as expected.)" %}

Here are a few more of the starmaps I've generated, without any post-processing. (You can click on any of these to view them in more detail.) 

<div class = "flexrow flexrow4">
{% include postImage.html imgName = "starmap10.png" caption = "10 nearest stars. Average error of about 8.88%" %}
{% include postImage.html imgName = "starmap20.png" caption = "20 nearest stars. Average error of about 13.2%" %}
{% include postImage.html imgName = "starmap50.png" caption = "50 nearest stars. Average error of about 16.4%" %}
{% include postImage.html imgName = "starmap100.png" caption = "100 nearest stars. Average error of about 16.0%" %}
</div>

As for the error indication, the blue lines represent specific distances that are over a user-inputted threshold (in this case, 85%), the red text simply lists the average error of all distances involving the given star, and the red halos are proportional to said error. All of this is toggle-able.

Something to note is that these maps are quite sensitive to initial conditions, so you may have to re-roll a few times until you get a map you're happy with. In my experience, the average map error for a given dataset could fall anywhere between 10-30%, but I'm sure this number changes when you're working with something other than stars or cities. 

## Beyond Starmaps

Even though the code is capable, there's not much use in stepping down higher-dimensional data to one, two, or three dimensions because, since it is primarily intended to be used as a cartography tool, my program does not normalize the data you feed it, and uniform higher dimensional coordinates are hard to come by. (If you were, say, a novelist trying to world-build a universe in which there were seven spatial dimensions, then yes, it could be useful.) 

I intend to continue working on this project. Besides the obvious refactoring, bug-squashing, and polishing, I'd also like to add support for wrap-around/toroidal space and perhaps globular, a GUI that shows live generation (like the GIF you saw earlier), and the ability to import CSV files. 