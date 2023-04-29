---
layout: post
title: "A Self-Improving, Semi-Autonomous, Voice-Activated GPT Assistant"
slug: gpt-assistant 
---

{% include postVideo.html vidName = "assistant-demo.mp4" caption = "A demo of the assistant. Some sections have been sped up and are clearly marked." width = "1080px" fileType="mp4" %}

This is a quick showcase of something I've been working on for the past couple of weeks. There's still a lot of work to be done, but I'm writing this now to avoid repeating previous mistakes---I put off writing about my last, davinci-based chat bot until it was 'presentable', and by then it had been obsoleted by GPT-3.5-turbo and ChatGPT plugins.

Even in a more polished state, this bot isn't going to do everything for you. I use it for brainstorming, troubleshooting, high-level design, and tedious things like making Tkinter interfaces. I'd already used ChatGPT a fair amount in my day-to-day, and it's been noticeably more convenient to be able to just say "computer" and ask questions without having to tab over to OpenAI and type them out. 

My end goal is a smart assistant that can control my lights, music, etc., and perform internet queries slightly more complicated than what I could do with "Ok, Google"---this would make my commutes more productive/bearable and help me cut back on screen time in general. 

## Capabilities

### Hardcoded

I programmed the following capabilities into the bot myself:
- Speech recognition and synthesis with [Porcupine](https://picovoice.ai/platform/porcupine/) and [Cobra](https://picovoice.ai/platform/cobra/), [whisper.cpp](https://github.com/ggerganov/whisper.cpp), and [ElevenLabs](https://elevenlabs.io)
- A simple console-style interface made with Tkinter
- A scheduler for executing commands at fixed intervals
- Persistent memory with naive recall (retrieves relevant memories by finding the nearest neighbors to each query) built with [Pinecone](https://www.pinecone.io/)
- The ability to create and manage commands (arbitrary Python code)

### Self-implemented

The bot gave itself the ability to do the following upon my request, completely through dialogue*:
- Read text files
- Read text from documents (pdf, doc, etc.)
- Create files and directories 
- Get a filepath from the user with a file selection dialog
- View open windows
- Scrape text from a given window with [Tesseract OCR](https://github.com/tesseract-ocr/tesseract)
- Perform Google searches
- Browse webpages (scrape and read their text)
- Securely store secrets**
- Run arbitrary bash script with user permission

It also implemented for itself:
- A Gmail address; the bot checks the inbox periodically and responds to any new mail.
- A Telegram bot; the bot uses long polling (its idea) and responds to messages pretty much instantaneously.

The bot is decently capable of stringing these together to get things done, but it does sometimes need a little encouragement. It could "email my brother's school calling in sick for him" without intervention, but not "create a to-do list app in Angular with Auth0" (yet).

<div class = "small-print" markdown="1">
<br>
\**I had to fix some issues with the Spotify implementation myself---the library it chose was prompting for user input in stdout, which was not being fed back to the bot. I feel like this more on me and that the bot did fine with what it was given.*

\***I implemented helper functions `save_secret` and `get_secret`, but the bot wrote the code to prompt the user for secrets and pass them to said helpers.*

</div>
## Design

This will probably be subject to change---I have a million different ideas to try out.

### Prompting

In a system message, I tell GPT-4 that it is "Alex, a speech-enabled assistant and conversation partner." I give it a few personality guidelines, and instruct it to use the following XML tags in its responses:

```
<input medium="console">...</input> - Represents user's typed console input
<input medium="speech">...</input> - Represents user's spoken input
<command-output>...</command-output> - Output yielded from commands you execute

<output medium="speech">...</output> - Read the text aloud to the user
<output medium="console">...</output> - Print the text to the console
<command>...</command> - Execute the enclosed command
<var name="VARNAME">...</var> - Store the content in VARNAME, use as $VARNAME in commands
<thought>...</thought> - For planning and reasoning (mandatory before each tag)
<schedule name="NAME" description="DESCRIPTION" instructions="INSTRUCTIONS" period="PERIOD">COMMAND</schedule> - Schedules a command to be run ever PERIOD seconds if set and to be handled with the provided instructions. If period is unset, the task will retrigger after every completion. The description should give instructions on what to do with output.
<unschedule>NAME</unschedule> - Unschedule a command to be run
<listen /> - Listen for user audio
<end-of-response /> - End your message (mandatory)
```

Right now these are hardcoded in, but I plan soon to construct this boiler on startup based on the condigured interfaces and their associated tags.

I then let it know what commands it has access to, give it a few more guidelines, examples, and start giving it user input. 

### Response Handling

I've tried my best not to build a monolith. The system is broken into specialized components. I've built six so far, which can be mixed and matched with no problem.
- Brain: Formats input and feeds it to GPT, pipes output to other components
- Listener: Listens for wake words, processes speech, and sends transcriptions to the brain as input
- Executor: Manages and executes commands. Also synthesizes speech (yes, this does need to be separated into two components)
- Scheduler: Handles creation, deletion, and execution of scheduled commands
- Recaller: Prepends all input with relevant "memories" retrieved from vectorized historical chatlog
- Terminal: The earlier-mentioned Tkinter interface that facilitates text-based I/O

Components are effectively arranged in a loop (interfaces -> afferent components -> brain -> efferent components -> interfaces -> etc.) by a Mediator, which facilitates inter-component communication. Signals are passed from component to component as JSON objects and are either transformed, acted upon, or ignored and passed on unchanged. 

{% include postImage.html imgName = "gptSignals.gif" width="525px" caption = "A simplified animated representation of a three-component configuration" %}

This modular structure makes the actual main method pretty simple:

```
comms = Mediator()

scheduler = Scheduler()
brain = Brain()
executor = Executor(stream_audio=True)
terminal = Terminal()
recaller = Recaller()

comms.register_responder(brain)
comms.register_interface(executor)
comms.register_interface(terminal)
comms.register_interface(scheduler)
comms.add_afferent(recaller)

scheduler.start()
executor.start()
terminal.start()
```


<span class = "small-print"><br>*Note: This entire architecture was loosely inspired by a lesson from my neuroscience-minor girlfriend (she likes to study by teaching) that touched on efferent and afferent pathways. I myself am not a neuroscience major, and I understand that my use of the terms here might not be completely correct. For our purposes, afferent components intercept/process signals heading towards the brain, and efferent, those away.*</span>


### Commands

One of the few commands the bot has hardcoded into it is `create_command`:

```
create_command --command_name="" --description="" --script_content="" --dependencies=""
```

This creates a command for the bot to use later, just as it used this one. The script content is saved to a Python module in a commands package, and a virtual environment is created for it with the provided dependencies. In the description for `create_command`, the bot is instructed to include an `execute` method whose return value will be output when the command is called. The arguments are inferred from this method's signature, and they, along with the command name and description, are saved to a JSON file which is used to construct the boilerplate on startup.

When a bot-created command is called, the appropriate module is loaded with importlib and the `execute` method is called from the command's virtual environment.

## Future Plans

- Let the bot spawn (containerized?) [AutoGPT](https://github.com/Significant-Gravitas/Auto-GPT) instances
- Save on tokens by letting the bot quote previous messages by reference (i.e. named variables) instead of verbatim regeneration
- Modularize components/interfaces and allow the bot to create them
- Dynamically generate boilerplate based on configured components
- Better-than-naive memory recall
- Use recall to identify useful commands per query instead of including them all in boiler
- Use GPT-3.5 for intermediate logic
- Give the bot eyes with [MiniGPT-4](https://minigpt-4.github.io/)
- Fork [Cool-Retro-Term](https://github.com/Swordfish90/cool-retro-term) for a cooler terminal interface

I haven't released the source yet since the architecture of the whole system is not yet stable, and because it's still all tangled up with my own utility libraries, but if you'd like to collaborate or are interested in this project in any way, feel free to reach out to me at [ken@kenmyers.io](mailto:ken@kenmyers.io). 