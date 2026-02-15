// Game State
let currentCase = null;
let gameTime = 0;
let timerInterval = null;
let testsRevealed = {
    blood: false,
    xray: false,
    ecg: false
};
let treatmentApplied = false;
let notes = [];
let storyIndex = 0;

// Load JSON cases (place your JSON files in the same directory or use relative paths)
async function loadCases() {
    // In a real implementation, you would fetch these from separate JSON files
    // For GitHub Pages, you can either:
    // 1. Fetch from separate .json files
    // 2. Or embed them directly in the JS (shown below)
    
    const caseFiles = [
        'hypothermia.json',
        'anaphylaxis.json',
        'appendicitis.json',
        'trauma.json',
        'dehydration.json'
    ];
    
    // Try to fetch from files, if fails, use embedded data
    try {
        const promises = caseFiles.map(file => 
            fetch(file).then(res => res.json()).catch(() => null)
        );
        const cases = await Promise.all(promises);
        const validCases = cases.filter(c => c !== null);
        
        if (validCases.length > 0) {
            return validCases;
        }
    } catch (error) {
        console.log('Using embedded case data');
    }
    
    // Fallback: Embedded case data
    return getEmbeddedCases();
}

function getEmbeddedCases() {
    // This function will be populated with your 5 JSON cases
    // You'll paste the JSON data here
    return [
        // Cases will be added here
    ];
}

// Initialize game
function startGame() {
    document.getElementById('startOverlay').style.display = 'none';
    loadNewCase();
    startTimer();
}

// Timer
function startTimer() {
    gameTime = 0;
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(() => {
        gameTime++;
        const minutes = Math.floor(gameTime / 60);
        const seconds = gameTime % 60;
        document.getElementById('gameTime').textContent = 
            `⏰ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }, 1000);
}

// Load new case
async function loadNewCase() {
    // Reset game state
    testsRevealed = { blood: false, xray: false, ecg: false };
    treatmentApplied = false;
    notes = [];
    storyIndex = 0;
    gameTime = 0;
    
    // Hide outcome section
    document.getElementById('outcomeSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    
    // Load cases
    const cases = await loadCases();
    
    // Select random case
    currentCase = cases[Math.floor(Math.random() * cases.length)];
    
    // Display patient info
    displayPatientInfo();
    displayStory();
    displayDialogue();
    generateTreatmentButtons();
    resetTestButtons();
    addNote('Patient admitted to ER');
}

// Display patient information
function displayPatientInfo() {
    const { patient } = currentCase;
    
    document.getElementById('patientName').textContent = patient.name;
    document.getElementById('patientAge').textContent = patient.age;
    document.getElementById('patientGender').textContent = patient.gender;
    
    document.getElementById('heartRate').textContent = `${patient.vitals.heartRate} bpm`;
    document.getElementById('temperature').textContent = `${patient.vitals.temperature} °C`;
    document.getElementById('oxygen').textContent = `${patient.vitals.oxygen} %`;
    
    // Display symptoms
    const symptomsList = document.getElementById('symptomsList');
    symptomsList.innerHTML = '';
    patient.symptoms.forEach(symptom => {
        const li = document.createElement('li');
        li.textContent = symptom;
        symptomsList.appendChild(li);
    });
}

// Display story progressively
function displayStory() {
    const storyContent = document.getElementById('storyContent');
    storyContent.innerHTML = '';
    
    // Display story paragraphs based on progress
    const paragraphsToShow = Math.min(storyIndex + 2, currentCase.storyFlow.length);
    
    for (let i = 0; i < paragraphsToShow; i++) {
        const p = document.createElement('p');
        p.textContent = currentCase.storyFlow[i];
        storyContent.appendChild(p);
    }
}

// Display nurse dialogue
function displayDialogue() {
    const dialogueContent = document.getElementById('dialogueContent');
    dialogueContent.innerHTML = '';
    
    currentCase.nurseDialogue.forEach(dialogue => {
        const p = document.createElement('p');
        p.textContent = dialogue;
        dialogueContent.appendChild(p);
    });
}

// Order test
function orderTest(testType) {
    if (testsRevealed[testType]) return;
    
    testsRevealed[testType] = true;
    
    // Disable button
    document.getElementById(`${testType}Test`).disabled = true;
    
    // Show results section
    document.getElementById('resultsSection').style.display = 'block';
    
    // Add result
    const resultsContent = document.getElementById('resultsContent');
    const resultItem = document.createElement('div');
    resultItem.className = 'result-item';
    
    const title = document.createElement('span');
    title.className = 'result-title';
    title.textContent = testType.toUpperCase() + ' Results:';
    
    const description = document.createElement('p');
    description.textContent = currentCase.tests[testType].description;
    
    resultItem.appendChild(title);
    resultItem.appendChild(description);
    resultsContent.appendChild(resultItem);
    
    // Add note
    addNote(`Ordered ${testType.toUpperCase()} test`);
    
    // Progress story
    if (storyIndex < currentCase.storyFlow.length - 1) {
        storyIndex++;
        displayStory();
    }
}

// Generate treatment buttons
function generateTreatmentButtons() {
    const container = document.getElementById('treatmentButtons');
    container.innerHTML = '';
    
    currentCase.treatments.forEach((treatment, index) => {
        const button = document.createElement('button');
        button.className = 'action-btn treatment-btn';
        button.textContent = treatment.name;
        button.onclick = () => applyTreatment(index);
        container.appendChild(button);
    });
}

// Apply treatment
function applyTreatment(index) {
    if (treatmentApplied) return;
    
    treatmentApplied = true;
    const treatment = currentCase.treatments[index];
    
    // Disable all treatment buttons
    const buttons = document.querySelectorAll('.treatment-btn');
    buttons.forEach(btn => btn.disabled = true);
    
    // Add note
    addNote(`Applied treatment: ${treatment.name}`);
    
    // Show outcome
    setTimeout(() => {
        showOutcome(treatment);
    }, 1000);
}

// Show outcome
function showOutcome(treatment) {
    const outcomeSection = document.getElementById('outcomeSection');
    const outcomeBox = outcomeSection.querySelector('.outcome-box');
    const outcomeIcon = document.getElementById('outcomeIcon');
    const outcomeTitle = document.getElementById('outcomeTitle');
    const outcomeMessage = document.getElementById('outcomeMessage');
    
    // Determine outcome
    let outcomeType;
    if (treatment.correct) {
        outcomeType = 'success';
        outcomeIcon.textContent = '🎉';
        outcomeTitle.textContent = 'EXCELLENT WORK, DOCTOR!';
    } else {
        outcomeType = 'failure';
        outcomeIcon.textContent = '💔';
        outcomeTitle.textContent = 'CRITICAL ERROR';
    }
    
    // Set outcome class
    outcomeBox.className = `outcome-box ${outcomeType}`;
    
    // Set message
    outcomeMessage.textContent = treatment.effect;
    
    // Show outcome section
    outcomeSection.style.display = 'block';
    
    // Scroll to outcome
    outcomeSection.scrollIntoView({ behavior: 'smooth' });
    
    // Stop timer
    if (timerInterval) {
        clearInterval(timerInterval);
    }
}

// Reset test buttons
function resetTestButtons() {
    document.getElementById('bloodTest').disabled = false;
    document.getElementById('xrayTest').disabled = false;
    document.getElementById('ecgTest').disabled = false;
    document.getElementById('resultsContent').innerHTML = '';
}

// Add note
function addNote(text) {
    const notesContent = document.getElementById('notesContent');
    const noteItem = document.createElement('div');
    noteItem.className = 'note-item';
    
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    const timeText = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    noteItem.innerHTML = `
        <span class="note-time">${timeText}</span>
        <span class="note-text">${text}</span>
    `;
    
    notesContent.appendChild(noteItem);
    
    // Scroll to bottom
    notesContent.scrollTop = notesContent.scrollHeight;
}

// Initialize on page load
window.addEventListener('load', () => {
    // Game starts with overlay showing
    console.log('ER Simulator loaded. Click START SHIFT to begin.');
});
