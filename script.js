// ============================================
// MIRROR YOGA GAME - MAIN SCRIPT
// ============================================

let detector;
let targetPoseData;
let comparisonInterval;
let isProcessing = false;
let currentLevel = 'easy';
let gameStarted = false;
let bestScore = 0;
let currentScore = 0;
let sessionScores = [];
let currentPoseIndex = 0;
let timeLeft = 0;
let timerInterval;

// Yoga poses for each level
const yogaPoses = {
    easy: [
        { name: 'Mountain Pose (Tadasana)', time: 30 },
        { name: 'Tree Pose (Vrksasana)', time: 30 },
        { name: 'Warrior I (Virabhadrasana I)', time: 30 },
        { name: 'Downward Dog (Adho Mukha Svanasana)', time: 30 },
        { name: 'Child Pose (Balasana)', time: 30 },
        { name: 'Corpse Pose (Savasana)', time: 30 }
    ],
    medium: [
        { name: 'Mountain Pose', time: 20 },
        { name: 'Tree Pose', time: 20 },
        { name: 'Warrior I', time: 20 },
        { name: 'Warrior II', time: 20 },
        { name: 'Triangle Pose', time: 20 },
        { name: 'Downward Dog', time: 20 },
        { name: 'Plank Pose', time: 20 },
        { name: 'Cobra Pose', time: 20 },
        { name: 'Child Pose', time: 20 },
        { name: 'Corpse Pose', time: 20 }
    ],
    hard: [
        { name: 'Mountain Pose', time: 15 },
        { name: 'Tree Pose', time: 15 },
        { name: 'Warrior I', time: 15 },
        { name: 'Warrior II', time: 15 },
        { name: 'Warrior III', time: 15 },
        { name: 'Triangle Pose', time: 15 },
        { name: 'Extended Side Angle', time: 15 },
        { name: 'Downward Dog', time: 15 },
        { name: 'Plank Pose', time: 15 },
        { name: 'Chaturanga Dandasana', time: 15 },
        { name: 'Upward Dog', time: 15 },
        { name: 'Cobra Pose', time: 15 },
        { name: 'Child Pose', time: 15 },
        { name: 'Happy Baby', time: 15 },
        { name: 'Corpse Pose', time: 15 }
    ]
};

const video = document.getElementById('userVideo');
const targetCanvas = document.getElementById('targetCanvas');
const userCanvas = document.getElementById('userCanvas');

// ============================================
// INITIALIZATION
// ============================================

async function initPoseDetection() {
    try {
        detector = await poseDetection.createDetector(
            poseDetection.SupportedModels.MoveNet,
            { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING }
        );
        console.log('✅ Pose detector initialized');
        await setupCamera();
    } catch (error) {
        console.error('❌ Failed to initialize detector:', error);
        alert('Failed to initialize pose detector. Please refresh the page.');
    }
}

async function setupCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480 }
        });
        video.srcObject = stream;
        console.log('✅ Camera ready');
    } catch (error) {
        console.error('❌ Camera access denied:', error);
        alert('Please allow camera access to play the game');
    }
}

// ============================================
// MENU FUNCTIONS
// ============================================

function startGame(level) {
    currentLevel = level;
    currentPoseIndex = 0;
    sessionScores = [];
    bestScore = 0;
    
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('gameScreen').classList.add('active');
    document.getElementById('levelDisplay').innerText = `Level: ${level.charAt(0).toUpperCase() + level.slice(1)}`;
    
    gameStarted = true;
    loadNextPose();
}

function backToMenu() {
    gameStarted = false;
    if (comparisonInterval) clearInterval(comparisonInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    document.getElementById('mainMenu').classList.add('active');
    document.getElementById('gameScreen').classList.remove('active');
    document.getElementById('leaderboard').classList.remove('active');
    document.getElementById('guide').classList.remove('active');
    
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('statusMessage').innerText = '';
}

function showLeaderboard() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('leaderboard').classList.add('active');
    displayLeaderboard();
}

function showGuide() {
    document.getElementById('mainMenu').classList.remove('active');
    document.getElementById('guide').classList.add('active');
}

function clearAllScores() {
    if (confirm('Are you sure you want to clear all scores?')) {
        localStorage.removeItem('yogaGameScores');
        alert('All scores cleared!');
        document.getElementById('leaderboard').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
    }
}

// ============================================
// POSE LOADING & SCORING
// ============================================

function loadNextPose() {
    const poses = yogaPoses[currentLevel];
    
    if (currentPoseIndex >= poses.length) {
        endGame();
        return;
    }
    
    const pose = poses[currentPoseIndex];
    document.getElementById('targetPoseName').innerText = pose.name;
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('statusMessage').innerText = '';
    document.getElementById('currentScore').innerText = '0%';
    
    // Generate sample target pose (in real app, load from images)
    generateSampleTargetPose();
    
    startPoseComparison(pose.time);
}

function generateSampleTargetPose() {
    // Create a sample pose for demonstration
    targetPoseData = {
        keypoints: [
            { x: 0.5, y: 0.2, score: 0.8 }, // nose
            { x: 0.45, y: 0.15, score: 0.8 }, // left eye
            { x: 0.55, y: 0.15, score: 0.8 }, // right eye
            { x: 0.4, y: 0.1, score: 0.7 }, // left ear
            { x: 0.6, y: 0.1, score: 0.7 }, // right ear
            { x: 0.35, y: 0.4, score: 0.8 }, // left shoulder
            { x: 0.65, y: 0.4, score: 0.8 }, // right shoulder
            { x: 0.3, y: 0.6, score: 0.8 }, // left elbow
            { x: 0.7, y: 0.6, score: 0.8 }, // right elbow
            { x: 0.25, y: 0.8, score: 0.8 }, // left wrist
            { x: 0.75, y: 0.8, score: 0.8 }, // right wrist
            { x: 0.35, y: 0.85, score: 0.8 }, // left hip
            { x: 0.65, y: 0.85, score: 0.8 }, // right hip
            { x: 0.3, y: 1.0, score: 0.8 }, // left knee
            { x: 0.7, y: 1.0, score: 0.8 }, // right knee
            { x: 0.25, y: 1.2, score: 0.8 }, // left ankle
            { x: 0.75, y: 1.2, score: 0.8 } // right ankle
        ]
    };
    
    drawPoseOnCanvas(targetCanvas, targetPoseData);
}

function drawPoseOnCanvas(canvas, pose) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#667eea';
    
    if (pose && pose.keypoints) {
        pose.keypoints.forEach(kp => {
            if (kp.score > 0.3) {
                ctx.beginPath();
                ctx.arc(kp.x * canvas.width, kp.y * canvas.height, 5, 0, 2 * Math.PI);
                ctx.fill();
            }
        });
    }
}

function startPoseComparison(duration) {
    timeLeft = duration;
    updateTimer();
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateTimer();
        
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            loadNextPose();
        }
    }, 1000);
    
    if (comparisonInterval) clearInterval(comparisonInterval);
    
    comparisonInterval = setInterval(async () => {
        if (!gameStarted || isProcessing) return;
        isProcessing = true;
        
        try {
            const poses = await detector.estimatePoses(video);
            if (poses.length > 0 && targetPoseData) {
                const score = calculateScore(poses[0], targetPoseData);
                currentScore = score;
                document.getElementById('currentScore').innerText = score + '%';
                
                if (score >= 70) {
                    document.getElementById('submitBtn').style.display = 'block';
                    document.getElementById('statusMessage').innerText = '✅ Great! Click Confirm to record your score';
                    document.getElementById('statusMessage').classList.add('success');
                } else {
                    document.getElementById('submitBtn').style.display = 'none';
                    document.getElementById('statusMessage').innerText = `⚠️ Need ${100 - score}% more accuracy`;
                    document.getElementById('statusMessage').classList.remove('success');
                    document.getElementById('statusMessage').classList.add('warning');
                }
                
                if (bestScore < score) {
                    bestScore = score;
                    document.getElementById('bestScore').innerText = bestScore + '%';
                }
                
                drawPoseOnCanvas(userCanvas, poses[0]);
            }
        } catch (error) {
            console.error('Pose detection error:', error);
        } finally {
            isProcessing = false;
        }
    }, 100);
}

function calculateScore(pose, targetPose) {
    if (!pose || !targetPose) return 0;
    
    let totalDistance = 0;
    let validPoints = 0;
    const minConfidence = 0.3;
    
    pose.keypoints.forEach((kp, i) => {
        const target = targetPose.keypoints[i];
        if (kp.score > minConfidence && target.score > minConfidence) {
            const dx = kp.x - target.x;
            const dy = kp.y - target.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            totalDistance += distance;
            validPoints++;
        }
    });
    
    if (validPoints === 0) return 0;
    
    const avgDistance = totalDistance / validPoints;
    const score = Math.max(0, Math.min(100, 100 - (avgDistance * 150)));
    return Math.round(score);
}

function updateTimer() {
    document.getElementById('timerDisplay').innerText = `⏱️ ${timeLeft}s`;
}

function submitScore() {
    if (currentScore < 70) return;
    
    const poses = yogaPoses[currentLevel];
    const poseName = poses[currentPoseIndex].name;
    
    // Save score
    saveScore({
        level: currentLevel,
        pose: poseName,
        score: currentScore,
        timestamp: new Date().toLocaleString()
    });
    
    sessionScores.push(currentScore);
    currentPoseIndex++;
    
    if (comparisonInterval) clearInterval(comparisonInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    playSound('success');
    alert(`✅ Score Saved: ${currentScore}%!`);
    
    loadNextPose();
}

function endGame() {
    gameStarted = false;
    if (comparisonInterval) clearInterval(comparisonInterval);
    if (timerInterval) clearInterval(timerInterval);
    
    const avgScore = sessionScores.length > 0 
        ? Math.round(sessionScores.reduce((a, b) => a + b) / sessionScores.length)
        : 0;
    
    alert(`🎉 Game Complete!\nLevel: ${currentLevel}\nPoses Completed: ${sessionScores.length}\nAverage Score: ${avgScore}%`);
    
    backToMenu();
}

// ============================================
// LEADERBOARD
// ============================================

function saveScore(scoreData) {
    const scores = JSON.parse(localStorage.getItem('yogaGameScores')) || [];
    scores.push(scoreData);
    localStorage.setItem('yogaGameScores', JSON.stringify(scores));
}

function displayLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('yogaGameScores')) || [];
    const leaderboardList = document.getElementById('leaderboardList');
    
    if (scores.length === 0) {
        leaderboardList.innerHTML = '<p>No scores yet. Start playing!</p>'; 
        return;
    }
    
    const topScores = scores.sort((a, b) => b.score - a.score).slice(0, 20);
    
    leaderboardList.innerHTML = topScores.map((score, i) => `
        <div class="leaderboard-item">
            <span class="leaderboard-rank">#${i + 1}</span>
            <div class="leaderboard-info">
                <div class="leaderboard-pose">${score.pose}</div>
                <small>${score.level} • ${score.timestamp}</small>
            </div>
            <span class="leaderboard-score">${score.score}%</span>
        </div>
    `).join('');
}

// ============================================
// SOUND EFFECTS
// ============================================

function playSound(type) {
    // Simple beep using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === 'success') {
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    }
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================

window.addEventListener('load', () => {
    initPoseDetection();
});