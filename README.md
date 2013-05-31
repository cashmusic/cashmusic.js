#cashmusic.js
cashmusic.js is a small JavaScript library that mostly doesn't exist yet. A few years ago we wrote a library called 
[Flower](http://cashmusic.org/tools/flower/), which was primarily used as a way of presenting consistent lightboxes 
and overlays, rendering custom audio players, and embedding video and image galleries. 
  
Flower did some things well, but also did too many things. The big problem we needed to solve was integration of 
audio and video players, with a huge bonus coming in the form of consistent styles and reuse of markup. It was built 
with MooTools and later integrated SoundManager 2. 
  
Now it's time to start work on a streamlined and improved version of that same idea. The name "Flower" doesn't fit 
our new (lack of) naming conventions, so instead we just named this after what it is...and after a David Bowie song. 
  
##The short version  
cashmusic.js needs a standard overlay/lightbox object that can be reused for an image gallery or for turning 
links to YouTube and Vimdeo into overlay embeds. 

It also needs an audio wrapper with Flash fallback to provide an interface (and programatic wrapper) for playing 
audio, including MP3s and mobile, with playlist support. 
  
There needs to be a centralized object so video players can talk to audio players, pause them, etc. That central 
object also needs to exist globally so we can reinitialize after an AJAX page load. 

All markup should be set using {{mustache}} so that defaults can be overwritten with new templates. 

##Libraries to include  
[hogan.js](http://twitter.github.com/hogan.js/)  
[SoundManager 2](http://www.schillmania.com/projects/soundmanager2/)  
  
##Specific behaviors
All effects should be triggered by divs and anchors with specific classnames. By default we should look for 
'.cashmusic' but that should be overridable. What should happen:

 - A .cashmusic &lt;div&gt; containing anchors linking directly to images: add images to an image lightbox. If 
   the div has a unique ID, the image lightbox should be restricted to images from that id, otherwise add them to a 
   global lightbox. Image title should be pulled from the "title" paramater of the anchor, and caption should be 
   pulled from the image "alt" parameter. Launch overlay on image click.
 - Individual &lt;img&gt; tags with the .cashmusic class should be added to the global image lightbox unless 
   they are contained by a .cashmusic &lt;div&gt;.
 - A .cashmusic.soundplayer &lt;div&gt; should look for links to audio, turn them into a playlist, and replace 
   itself with an audio player. Options could be stored using the html5 data parameters, including boolean to 
   show/hide playlist, link to a custom markup template, etc. 
 - All links to YouTube or Vimeo should parse the URLs and display the video in an embedded overlay.
 - On mobile sound players should perform normally, image galleries need mobile styling, and video should just link 
   through to the original location without embed.
 - Events:<br />
   In addition to the click events mentioned above, the library needs to fire or respond to the following events:  
    - Lightbox overlays should be dismissed by clicking the background or with the ESC key
    - Image lightboxes need to display next/previous links as well as respond to LEFT ARROW/RIGHT ARROW keys
    - Playing videos should pause with the SPACE key (where possible)
    - Overlays should fire an event on open with a string declaring it to be photo or video
    - Video overlays should pause any playing sound player when opened, resume when closed
    - Sound players should pause any playing sound players on play, no resume on pause
    - Sound players need to fire events for play, pause, next, previous, beforeplay, 
      progress (with percentage and current time), loading (with percentage), and loaded
    - Sound player play event should be dependent on beforeplay, allowing changes to the tracklist before play
      begins (swapping out details/source in the case of a secure player)
 - CSS:<br />
   All elements created should have css classes associated, allowing for CSS alterations to default layouts in 
   addition to the more advanced mustache re-templating.