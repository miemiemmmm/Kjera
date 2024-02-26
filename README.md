# Kjera

Welcome to **[Kjera](https://github.com/miemiemmmm/Kjera)**, a versatile template designed to seamlessly embed 3D objects and molecules into your presentations. Kjera leverages the capabilities of modern web technologies to create interactive and engaging presentations. 
To make the most out of the Kjera template, users should have a basic understanding of HTML and JavaScript which enables you to customize your presentations and integrate 3D models effectively.

<!-- This repository will be work as a template for you to make your own presentation. 
As demonstrated in its name, its uses [Reveal.js](https://revealjs.com/) as the presentation framework and [Three.js](https://threejs.org/) as a 3D engine. 
There are also [3Dmol.js](https://3dmol.csb.pitt.edu/) for molecular visualization.  -->

## Key Features
- Modern Web Standards and Libraries 
- Interactive Elements 
- Smooth Presentation Delivery 
- 3D Molecular Rendering 
- 3D Object Rendering 
- Mathematical Expressions 
- Dynamic Content Loading via GitHub API 


## Usage

Follow the steps below to use this template:
1. Click the "Use this template" button to create a new repository on GitHub
2. Set up the new GitHub repository name, description and visibility
3. Clone the new repository to your local machine
4. Check the [example slides](example_slides.html) for demonstration and further customization

The example slides is also hosted [HERE](https://miemiemmmm.b-cdn.net/Kjera/example_slides.html) for preview.

<!-- The indexing of the file is done by the resource (typically files you might request remotely), so you can use the same file name for different files in different folders. -->
<!-- 3. If the repository is private while you are working on it, generate an [access token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens) for this repository -->
<!-- 4. Drop your images, molecule, 3D object files in folder. We will index these files by their names (url). -->

### Adding New Slides
Under the **slide_container**, each **section** stands for a slide. Set the **data-state** attribute for further callback customization.
```
<!--Template page-->
<section data-state="slide_id">
    <p class="slide-title">Template Slide for Demonstration</p>
    <div class="box_style_rightbound">
        <p class="slide_item_style1">Context 1</p>
        <p class="slide_item_style1">Context 2</p>
        <p class="slide_item_style1">Context 3</p>
    </div>
</section>
```

### Positioning Text Boxes
Check the [style.css](styles.css) for the pre-defined box types (class name start with "box_style_"). 

To defined a new box type, add the following code to the [style sheet](styles.css). 
```
.box_style_custom{
    position: absolute;
    inset: 50% 60% 10% 10% !important; /* manually set the borders */
    padding: 10px !important;
    font-size: 20px;
    text-align: center;
}
```

### Slide-Specific Callback Function
```
Reveal.addEventListener( 'slidechanged', function( event ) {
    if (event.currentSlide && event.currentSlide.getAttribute('data-state') == "slide_id") {  // Replace here the slide data-state
        // Your code here
    }
});
```

## Kind Recommendations
- Use a smart IDE or AI copilot to help you write the code and focus on writing the content
- Use a local server to preview your slides
- Different screen resolutions may affect the layout, might need to zoom in/out to adjust the layout


## Readmap 
1. Support more 3D object file types
2. Animation of molecular dynamics trajectories

If you have more awesome ideas, please let me know by [creating an issue](https://github.com/miemiemmmm/Kjera/issues).

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments
Without the following libraries, this project would not be possible:<br>
<a href="https://revealjs.com/" target="_blank">Reveal.js</a>: Presentation framework<br>
<a href="https://threejs.org/" target="_blank">Three.js</a>: 3D object rendering<br>
<a href="https://3dmol.csb.pitt.edu/" target="_blank">3Dmol.js</a>: 3D molecule rendering<br>
<a href="https://mathjax.org/" target="_blank">MathJax</a>: LaTeX rendering<br>
<a href="https://jquery.com/" target="_blank">jQuery</a>: DOM element manipulation<br>

