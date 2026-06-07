/* =========================================
   JS VOICE NOTE - Audio Player & Live Transcript Logic
   ========================================= */

document.addEventListener('DOMContentLoaded', function() {

    // --- 1. Select DOM Elements ---
    const voiceNotePlayer = document.querySelector('.voice-note-player');
    
    // If the player doesn't exist on this page (e.g., Home page), stop execution
    if (!voiceNotePlayer) {
        return;
    }

    const audioElement = voiceNotePlayer.querySelector('audio');
    const playPauseBtn = voiceNotePlayer.querySelector('.voice-note-play-btn');
    const progressBar = voiceNotePlayer.querySelector('.voice-note-progress');
    const progressFill = voiceNotePlayer.querySelector('.voice-note-progress-fill');
    const currentTimeDisplay = voiceNotePlayer.querySelector('.voice-note-current-time');
    const totalTimeDisplay = voiceNotePlayer.querySelector('.voice-note-total-time');
    const transcriptContainer = voiceNotePlayer.querySelector('.voice-note-transcript');

    // --- 2. Transcript Data ---
    // This array holds the text and the exact time (in seconds) it should appear
    const transcriptData = [
        { time: 0, text: "Oh, hello there stranger!" },
        { time: 3, text: "I hope you're having a lovely day —" },
        { time: 6, text: "and I surely do hope you find my website to be as cool as I intended it to be." },
        { time: 10, text: "You're probably here for one of two reasons:" },
        { time: 13, text: "Either you're just curious —" },
        { time: 15, text: "exploring every corner," },
        { time: 17, text: "checking the designs," },
        { time: 19, text: "trying to get a little sneak peek of who I am, what I do," }
    ];

    // --- 3. Helper Functions ---

    // Format seconds into MM:SS
    function formatTime(seconds) {
        if (isNaN(seconds)) {
            return "0:00";
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        const formattedSeconds = remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds;
        return minutes + ':' + formattedSeconds;
    }

    // Update the transcript text based on current audio time
    function updateTranscript(currentTime) {
        let currentText = "";
        
        // Find the latest text block that should be displayed
        for (let i = 0; i < transcriptData.length; i++) {
            if (currentTime >= transcriptData[i].time) {
                currentText = transcriptData[i].text;
            } else {
                break;
            }
        }

        // Update the DOM
        if (transcriptContainer) {
            transcriptContainer.textContent = currentText;
            
            // Add typing class for the blinking cursor effect if audio is playing
            if (!audioElement.paused) {
                transcriptContainer.classList.add('typing');
            } else {
                transcriptContainer.classList.remove('typing');
            }
        }
    }

    // --- 4. Event Listeners ---

    // Play/Pause Button Click
    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', function() {
            if (audioElement.paused) {
                audioElement.play();
                // Change icon to pause (using SVG innerHTML replacement)
                playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';
            } else {
                audioElement.pause();
                // Change icon to play
                playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            }
        });
    }

    // Update Progress Bar and Time as Audio Plays
    if (audioElement) {
        audioElement.addEventListener('timeupdate', function() {
            const currentTime = audioElement.currentTime;
            const duration = audioElement.duration;

            // Update progress bar width
            if (progressFill && duration) {
                const progressPercentage = (currentTime / duration) * 100;
                progressFill.style.width = progressPercentage + '%';
            }

            // Update time displays
            if (currentTimeDisplay) {
                currentTimeDisplay.textContent = formatTime(currentTime);
            }
            if (totalTimeDisplay && duration) {
                totalTimeDisplay.textContent = formatTime(duration);
            }

            // Update transcript
            updateTranscript(currentTime);
        });

        // Set total time once metadata is loaded
        audioElement.addEventListener('loadedmetadata', function() {
            if (totalTimeDisplay) {
                totalTimeDisplay.textContent = formatTime(audioElement.duration);
            }
        });

        // Reset player when audio ends
        audioElement.addEventListener('ended', function() {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
            }
            if (progressFill) {
                progressFill.style.width = '0%';
            }
            if (transcriptContainer) {
                transcriptContainer.classList.remove('typing');
            }
        });
    }

    // Seek functionality: Click on progress bar to jump to that time
    if (progressBar && audioElement) {
        progressBar.addEventListener('click', function(event) {
            const rect = progressBar.getBoundingClientRect();
            const clickPosition = event.clientX - rect.left;
            const totalWidth = rect.width;
            const clickPercentage = clickPosition / totalWidth;
            
            if (audioElement.duration) {
                audioElement.currentTime = clickPercentage * audioElement.duration;
            }
        });
    }

});
