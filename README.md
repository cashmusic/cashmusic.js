#soundandvision.js
soundandvision.js is a small JavaScript library that doesn't exist yet. A few years ago we wrote a library called 
[Flower](http://cashmusic.org/tools/flower/), which was primarily used as a way of presenting consistent lightboxes 
and overlays, rendering custom audio players, and embedding video and image galleries. 
  
Flower did some things well, but also did too many things. The big problem we needed to solve was integration of 
audio and video players, with a huge bonus coming in the form of consistent styles and reuse of markup. It was built 
with MooTools and later integrated SoundManager 2. 
  
Now it's time to start work on a streamlined and improved version of that same idea. The name "Flower" doesn't fit 
our new (lack of) naming conventions, so instead we just named this after what it is...and after a David Bowie song. 
  
##The short version  
soundandvision.js needs a standard overlay/lightbox object that can be reused for an image gallery or for turning 
links to YouTube and Vimdeo into overlay embeds. 
  
There needs to be a centralized object so video players can talk to audio players, pause them, etc. That central 
object also needs to exist globally so we can reinitialize after an AJAX page load. 

All markup should be set using {{mustache}} so that defaults can be overwritten with new templates. 

##Libraries to include  
[hogan.js](http://twitter.github.com/hogan.js/)  
[SoundManager 2](http://www.schillmania.com/projects/soundmanager2/)  
[jQuery](http://jquery.com/)  
  
##Specific behaviors
All effects should be triggered by divs and anchors with specific classnames. By default we should look for 
'.soundandvision' but that should be overridable. What should happen:

 - A .soundandvision &lt;div&gt; containing anchors linking directly to images: add images to an image lightbox. If the div 
   has a unique ID, the image lightbox should be restricted to images from that id, otherwise add them to a global 
   lightbox. Image title should be pulled from the "title" paramater of the anchor, and caption should be pulled 
   from the image "alt" parameter. 
 - A .soundandvision &lt;div&gt; containing links to YouTube or Vimeo should parse the URLs and display the video in an 
   embedded overlay.
 - A .soundandvision.soundplayer &lt;div&gt; should look for links to audio, turn them into a playlist, and replace 
   itself with an audio player. Options could be stored using the html5 data parameters, including boolean to 
   show/hide playlist, link to a custom markup template, etc. 
 - On mobile sound players should perform normally, image galleries need mobile styling, and video should just link 
   through to the original location without embed.