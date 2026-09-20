/* ==============================================================================
   WYRM.studios — Voice Note Player & Live Cinematic Transcript
   Synchronized audio player for founder's personal introduction with floating bar
   ============================================================================== */

document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    const audio = document.getElementById('voice-note-audio');
    const playBtn = document.getElementById('voice-note-play-btn');
    const playIcon = document.getElementById('play-icon');
    const pauseIcon = document.getElementById('pause-icon');
    const progressBar = document.getElementById('voice-note-progress');
    const progressFill = document.getElementById('voice-note-progress-fill');
    const currentTimeEl = document.getElementById('voice-note-current-time');
    const transcriptEl = document.getElementById('voice-note-transcript');

    // Floating Player Elements
    const floatingVoiceNote = document.getElementById('floating-voice-note');
    const floatingPlayBtn = document.getElementById('floating-play-btn');
    const floatingPlayIcon = document.getElementById('floating-play-icon');
    const floatingPauseIcon = document.getElementById('floating-pause-icon');
    const floatingCloseBtn = document.getElementById('floating-close-btn');

    // If there is no voice note audio element on this page, exit cleanly
    if (!audio || !playBtn) return;

    let isPlaying = false;
    let currentTranscriptIndex = -1;

    // Transcript timeline with exact milliseconds mapping
    const transcriptScript = [
        { time: 0, text: "Hello there, stranger." },
        { time: 2075, text: "If you're reading this, you've found your way here." },
        { time: 5047, text: "Maybe it was luck. Maybe curiosity." },
        { time: 8943, text: "Or maybe you're here because you actually need something built." },
        { time: 11917, text: "However you arrived, stay a while." },
        { time: 15027, text: "Look around. I hope you enjoy what you find." },
        { time: 18839, text: "I'm Omar. This is wyrm.studios." },
        { time: 21623, text: "I make brands people remember." },
        { time: 24593, text: "Not just visuals. Not just videos." },
        { time: 26128, text: "I build complete identity systems:" },
        { time: 31065, text: "Brand Strategy • Brand Identity • Brand Films • Motion Design" },
        { time: 35748, text: "Take your time. The good stuff is right here." }
    ];

    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return mins + ':' + (secs < 10 ? '0' : '') + secs;
    }

    function updateIcons(playing) {
        if (playIcon) playIcon.style.display = playing ? 'none' : 'block';
        if (pauseIcon) pauseIcon.style.display = playing ? 'block' : 'none';
        if (floatingPlayIcon) floatingPlayIcon.style.display = playing ? 'none' : 'block';
        if (floatingPauseIcon) floatingPauseIcon.style.display = playing ? 'block' : 'none';
    }

    function updateTranscript(currentMs) {
        if (!transcriptEl) return;
        let activeIndex = -1;
        for (let i = transcriptScript.length - 1; i >= 0; i--) {
            if (currentMs >= transcriptScript[i].time) {
                activeIndex = i;
                break;
            }
        }

        if (activeIndex !== currentTranscriptIndex && activeIndex >= 0) {
            currentTranscriptIndex = activeIndex;
            transcriptEl.style.opacity = '0';
            setTimeout(function() {
                transcriptEl.textContent = transcriptScript[activeIndex].text;
                transcriptEl.style.opacity = '1';
            }, 150);
        }
    }

    function togglePlay() {
        if (isPlaying) {
            audio.pause();
            isPlaying = false;
            updateIcons(false);
            if (transcriptEl) transcriptEl.classList.remove('typing');
        } else {
            audio.play().then(function() {
                isPlaying = true;
                updateIcons(true);
                if (transcriptEl) transcriptEl.classList.add('typing');
            }).catch(function(err) {
                console.warn('Audio playback error:', err);
            });
        }
    }

    playBtn.addEventListener('click', togglePlay);
    if (floatingPlayBtn) floatingPlayBtn.addEventListener('click', togglePlay);

    // Audio time update
    audio.addEventListener('timeupdate', function() {
        const currentTime = audio.currentTime;
        const duration = audio.duration || 38;
        const progress = (currentTime / duration) * 100;

        if (progressFill) progressFill.style.width = progress + '%';
        if (currentTimeEl) currentTimeEl.textContent = formatTime(currentTime);

        updateTranscript(currentTime * 1000);
    });

    // Seek on progress bar click
    if (progressBar) {
        progressBar.addEventListener('click', function(e) {
            const rect = progressBar.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const progress = clickX / rect.width;
            const duration = audio.duration || 38;
            audio.currentTime = progress * duration;
        });
    }

    // Audio finished
    audio.addEventListener('ended', function() {
        isPlaying = false;
        updateIcons(false);
        if (progressFill) progressFill.style.width = '0%';
        if (currentTimeEl) currentTimeEl.textContent = '0:00';
        if (transcriptEl) {
            transcriptEl.textContent = 'Press play to hear from the founder';
            transcriptEl.classList.remove('typing');
        }
        currentTranscriptIndex = -1;
    });

    // Close floating bar
    if (floatingCloseBtn && floatingVoiceNote) {
        floatingCloseBtn.addEventListener('click', function() {
            floatingVoiceNote.style.display = 'none';
        });
    }
});
