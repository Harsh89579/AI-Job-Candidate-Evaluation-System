document.addEventListener('DOMContentLoaded', () => {

    // DOM Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadForm = document.getElementById('uploadForm');

    const resultsSection = document.getElementById('resultsSection');
    const loaderContainer = document.getElementById('loaderContainer');
    const resultsContent = document.getElementById('resultsContent');

    const decisionBadge = document.getElementById('decisionBadge');
    const scoreValue = document.getElementById('scoreValue');
    const scoreBar = document.getElementById('scoreBar');
    const skillsContainer = document.getElementById('skillsContainer');
    const toastContainer = document.getElementById('toastContainer');
    const confidenceValue = document.getElementById('confidenceValue');
    const interpretationLabel = document.getElementById('interpretationLabel');
    const previewText = document.getElementById('previewText');
    const downloadBtn = document.getElementById('downloadBtn');

    // SPA & 3-Page Elements
    const roleSelect = document.getElementById('roleSelect');
    const missingSkillsContainerWrap = document.getElementById('missingSkillsContainerWrap');
    const missingSkillsContainer = document.getElementById('missingSkillsContainer');
    const navBtns = document.querySelectorAll('.nav-btn');
    const pageSections = document.querySelectorAll('.page-section');
    const navSkillGap = document.getElementById('navSkillGap');
    const navInterview = document.getElementById('navInterview');

    // SPA Router
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('disabled')) return;
            // switch nav
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // switch page
            const targetId = btn.getAttribute('data-target');
            pageSections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.remove('hidden');
                    sec.classList.add('animate-fade-in');
                } else {
                    sec.classList.add('hidden');
                    sec.classList.remove('animate-fade-in');
                }
            });
        });
    });

    let currentFile = null;
    let latestAnalysisData = null;
    let currentRole = null;

    // ----- Drag and Drop Events -----

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    // File Input change event
    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    // Click anywhere on drop zone to trigger file input (if not clicking the browse btn specifically)
    dropZone.addEventListener('click', (e) => {
        if (e.target !== fileInput && !e.target.classList.contains('browse-btn')) {
            fileInput.click();
        }
    });

    // Handle File Selection
    function handleFiles(files) {
        console.log("handleFiles called with:", files);
        if (files.length > 0) {
            const file = files[0];
            console.log("Selected file:", file.name, "Size:", file.size, "Type:", file.type);
            const validTypes = ['.pdf', '.docx'];
            const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (validTypes.includes(fileExtension)) {
                currentFile = file;
                showFilePreview(file.name);
            } else {
                alert('Please upload a valid .pdf or .docx file.');
                resetFileInput();
            }
        }
    }

    function showFilePreview(name) {
        dropZone.classList.add('hidden');
        filePreview.classList.remove('hidden');
        fileName.textContent = name;
        analyzeBtn.disabled = false;

        // Change icon based on doc type
        const icon = filePreview.querySelector('.file-icon');
        if (name.toLowerCase().endsWith('.docx')) {
            icon.className = 'fa-solid fa-file-word file-icon';
            icon.style.color = '#2563eb'; // Blue for Word
        } else {
            icon.className = 'fa-solid fa-file-pdf file-icon';
            icon.style.color = '#ef4444'; // Red for PDF
        }
    }

    function resetFileInput() {
        currentFile = null;
        fileInput.value = '';
        filePreview.classList.add('hidden');
        dropZone.classList.remove('hidden');
        analyzeBtn.disabled = true;

        // Reset Stepper
        document.getElementById('step-upload').className = 'step-item active';
        document.getElementById('step-analyze').className = 'step-item';
        document.getElementById('step-action').className = 'step-item';
    }

    removeFileBtn.addEventListener('click', resetFileInput);

    // ----- Form Submission & Fetch API -----

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get file directly from the input element to ensure it's not stale
        const uploadedFile = fileInput.files[0] || currentFile;

        if (!uploadedFile) {
            alert('Please select a file to upload.');
            return;
        }

        if (!roleSelect.value) {
            alert('Please select a Target Role first.');
            return;
        }

        // --- NEW: Pre-upload Validation ---
        const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
        if (uploadedFile.size > MAX_FILE_SIZE) {
            showToast("File is too large. Maximum size is 5MB.", "error");
            return;
        }

        const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.toLowerCase().endsWith('.pdf') && !uploadedFile.name.toLowerCase().endsWith('.docx')) {
            showToast("Invalid file type. Only PDF and DOCX are allowed.", "error");
            return;
        }
        // ----------------------------------

        currentRole = roleSelect.value;
        currentFile = uploadedFile;

        // Reset Nav
        navSkillGap.classList.add('disabled');
        navSkillGap.disabled = true;
        navInterview.classList.add('disabled');
        navInterview.disabled = true;

        // UI Updates: Show loading state
        resultsSection.classList.remove('hidden');
        loaderContainer.classList.remove('hidden');
        resultsContent.classList.add('hidden');
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyzing...</span><i class="fa-solid fa-spinner fa-spin"></i>';

        // --- NEW: Determinate Progress Simulation ---
        const loaderText = loaderContainer.querySelector('p');
        const originalLoaderText = loaderText.textContent;

        // Inject a progress bar if it doesn't exist
        if (!document.getElementById('analysisProgressBar')) {
            const barContainer = document.createElement('div');
            barContainer.className = 'progress-bar-container';
            barContainer.style.width = '80%';
            barContainer.style.marginTop = '1rem';
            barContainer.innerHTML = '<div class="progress-bar" id="analysisProgressBar" style="width: 0%; transition: width 0.5s ease;"></div>';
            loaderContainer.appendChild(barContainer);
        }

        const progressBar = document.getElementById('analysisProgressBar');
        progressBar.style.width = '10%';
        loaderText.textContent = "Uploading document...";

        // Show Skeletons early
        document.getElementById('actualResultsData').classList.add('hidden');
        document.getElementById('skeletonLoader').classList.remove('hidden');

        // Update Stepper
        document.getElementById('step-upload').className = 'step-item completed';
        document.getElementById('step-analyze').className = 'step-item active';

        let progressInterval = setTimeout(() => {
            progressBar.style.width = '40%';
            loaderText.textContent = "Extracting text and formatting...";
        }, 1500);

        let progressInterval2 = setTimeout(() => {
            progressBar.style.width = '75%';
            loaderText.textContent = "AI is evaluating skills and suitability...";
        }, 3500);
        // --------------------------------------------

        // Explicitly create FormData and append exactly what the backend expects
        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('role', currentRole);

        console.log("Submitting Request... Form Data prepared:");
        for (let [key, value] of formData.entries()) {
            console.log("Key:", key, "| Value:", value);
        }

        try {
            // Send file to FastAPI backend
            console.log("Calling fetch to http://localhost:8000/analyze_resume");
            const response = await fetch('http://localhost:8000/analyze_resume', {
                method: 'POST',
                body: formData
                // Note: Do NOT set Content-Type header manually when using FormData
            });

            console.log("Response Received:", response.status);

            if (!response.ok) {
                let errMessage = 'Failed to analyze resume.';
                try {
                    const errData = await response.json();
                    errMessage = errData.detail || errMessage;
                } catch (e) {
                    errMessage = `Server error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errMessage);
            }

            const data = await response.json();
            latestAnalysisData = data;

            // Artificial delay for smooth aesthetic UX
            setTimeout(() => {
                displayResults(data);
                showToast("Resume analyzed successfully", "success");

                // --- NEW: Save to History ---
                saveToHistory(currentFile.name, data.resume_score, currentRole);
                // -----------------------------

                // Route to Next Page Logic (Enable nav and inject buttons)
                if (data.resume_score < 60) {
                    navSkillGap.classList.remove('disabled');
                    navSkillGap.disabled = false;

                    // Inject quick-action button
                    injectNextStepAction('skill-gap', 'View Learning Roadmap <i class="fa-solid fa-arrow-right"></i>');

                    triggerSkillGapAnalysis(data.missing_skills);
                } else {
                    navInterview.classList.remove('disabled');
                    navInterview.disabled = false;

                    // Inject quick-action button
                    injectNextStepAction('interview', 'Proceed to AI Interview <i class="fa-solid fa-arrow-right"></i>');

                    triggerAiInterview(data.skills);
                }
            }, 800);

        } catch (error) {
            console.error("Upload Error:", error);
            showToast(`Error: ${error.message}`, "error");
            resultsSection.classList.add('hidden');

            // Reset Stepper on error
            document.getElementById('step-upload').className = 'step-item active';
            document.getElementById('step-analyze').className = 'step-item';
            document.getElementById('step-action').className = 'step-item';

        } finally {
            // Cleanup progress simulation
            clearTimeout(progressInterval);
            clearTimeout(progressInterval2);
            if (progressBar) progressBar.style.width = '100%';
            setTimeout(() => {
                loaderText.textContent = originalLoaderText;
                if (progressBar) progressBar.style.width = '0%';
            }, 1000);

            // Advance Stepper on success
            if (latestAnalysisData) {
                document.getElementById('step-analyze').className = 'step-item completed';
                document.getElementById('step-action').className = 'step-item active';
            }

            // Reset button state
            analyzeBtn.disabled = false;
            analyzeBtn.innerHTML = '<span class="btn-text">Analyze Candidate</span><i class="fa-solid fa-wand-magic-sparkles"></i>';
        }
    });

    // ----- Render Results -----

    function displayResults(data) {
        // Hide loader AND skeletons, show actual data
        loaderContainer.classList.add('hidden');
        document.getElementById('skeletonLoader').classList.add('hidden');

        const actualDataContainer = document.getElementById('actualResultsData');
        actualDataContainer.classList.remove('hidden');
        actualDataContainer.classList.add('animate-fade-in');

        resultsContent.classList.remove('hidden');

        // Animate Score
        const score = data.resume_score;
        animateValue(scoreValue, 0, score, 1000);

        // Progress Bar & Interpretation
        setTimeout(() => {
            scoreBar.style.width = `${score}%`;

            // Color gradient & Text based on score boundaries
            if (score >= 80) {
                scoreBar.style.background = 'linear-gradient(90deg, #10b981, #34d399)';
                interpretationLabel.textContent = "Highly Suitable";
                interpretationLabel.style.color = "#34d399";
            } else if (score >= 60) {
                scoreBar.style.background = 'linear-gradient(90deg, #3b82f6, #60a5fa)';
                interpretationLabel.textContent = "Moderately Suitable";
                interpretationLabel.style.color = "#60a5fa";
            } else if (score >= 40) {
                scoreBar.style.background = 'linear-gradient(90deg, #fbbf24, #fbbf24)';
                interpretationLabel.textContent = "Needs Review";
                interpretationLabel.style.color = "#fcd34d";
            } else {
                scoreBar.style.background = 'linear-gradient(90deg, #ef4444, #f87171)';
                interpretationLabel.textContent = "Not Suitable";
                interpretationLabel.style.color = "#f87171";
            }
        }, 100);

        // Confidence
        if (confidenceValue) {
            confidenceValue.textContent = data.confidence;
        }

        // Preview Text
        if (previewText) {
            // Emphasize skills in the preview text if they exist
            let highlightedText = data.preview_text;
            if (data.skills && data.skills.length > 0) {
                // Create a regex to match any of the skills (case-insensitive)
                const escapedSkills = data.skills.map(s => s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                const pattern = new RegExp(`\\b(${escapedSkills.join('|')})\\b`, 'gi');
                highlightedText = highlightedText.replace(pattern, '<strong>$1</strong>');
            }
            previewText.innerHTML = `"${highlightedText}"`;
        }

        // Decision Badge
        const isSuitable = data.prediction === "Suitable";
        if (isSuitable) {
            decisionBadge.className = 'decision-badge suitable';
            decisionBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Suitable';
        } else {
            decisionBadge.className = 'decision-badge unsuitable';
            decisionBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Not Suitable';
        }

        // Render Skills
        skillsContainer.innerHTML = '';
        if (data.skills && data.skills.length > 0) {
            data.skills.forEach(skill => {
                const badge = document.createElement('div');
                badge.className = 'skill-badge';
                badge.textContent = skill.toUpperCase();
                skillsContainer.appendChild(badge);
            });
        } else {
            // Render Missing Skills
            missingSkillsContainer.innerHTML = '';
            if (data.missing_skills && data.missing_skills.length > 0) {
                missingSkillsContainerWrap.classList.remove('hidden');
                data.missing_skills.forEach(skill => {
                    const badge = document.createElement('div');
                    badge.className = 'skill-badge';
                    badge.style.color = '#f87171';
                    badge.style.background = 'rgba(239, 68, 68, 0.1)';
                    badge.style.borderColor = 'rgba(239, 68, 68, 0.3)';
                    badge.textContent = skill.toUpperCase();
                    missingSkillsContainer.appendChild(badge);
                });
            } else {
                missingSkillsContainerWrap.classList.add('hidden');
            }
        }

        // Number animation helper for score
        function animateValue(obj, start, end, duration) {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                obj.innerHTML = (progress * (end - start) + start).toFixed(2);
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        }
    }

    // --- NEW: Helper to Inject Next Step Action Button ---
    function injectNextStepAction(targetSection, htmlContent) {
        // Remove existing if any
        const existingBtn = document.getElementById('nextStepActionBtn');
        if (existingBtn) existingBtn.remove();

        const btn = document.createElement('button');
        btn.id = 'nextStepActionBtn';
        btn.className = 'submit-btn mt-4 animate-fade-in';
        btn.style.width = '100%';
        btn.innerHTML = htmlContent;

        btn.addEventListener('click', () => {
            if (targetSection === 'skill-gap') {
                document.getElementById('navSkillGap').click();
            } else {
                document.getElementById('navInterview').click();
            }
        });

        document.getElementById('resultsContent').appendChild(btn);
    }
    // ----------------------------------------------------

    // --- NEW: History Storage ---
    function saveToHistory(filename, score, role) {
        let history = JSON.parse(localStorage.getItem('hrvision_history') || '[]');

        // Add new item to front
        history.unshift({
            filename: filename,
            score: score.toFixed(1),
            role: role,
            date: new Date().toLocaleDateString()
        });

        // Keep only last 3
        if (history.length > 3) history = history.slice(0, 3);

        localStorage.setItem('hrvision_history', JSON.stringify(history));
        renderHistory();
    }

    function renderHistory() {
        const historyContainer = document.getElementById('historyContainer');
        if (!historyContainer) return;

        const history = JSON.parse(localStorage.getItem('hrvision_history') || '[]');
        if (history.length === 0) {
            historyContainer.innerHTML = '<p style="color:var(--text-secondary); font-size:0.9rem; font-style:italic;">No recent uploads.</p>';
            return;
        }

        historyContainer.innerHTML = '';
        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                 <div><i class="fa-solid fa-file-pdf" style="color:#ef4444;"></i> <span style="font-weight: 500;">${item.filename}</span></div>
                 <div style="font-size:0.8rem; color:var(--text-secondary); margin-top:4px;">${item.role} • Score: <span style="color:var(--text-primary); font-weight:600;">${item.score}</span></div>
                 <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:2px;">${item.date}</div>
             `;
            historyContainer.appendChild(div);
        });
    }

    // Call on load
    renderHistory();
    // ----------------------------

    // ----- Toast Notifications -----
    function showToast(message, type = "success") {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const icon = type === 'success' ? '<i class="fa-solid fa-circle-check"></i>' : '<i class="fa-solid fa-circle-exclamation"></i>';

        toast.innerHTML = `
            ${icon}
            <div class="toast-content">
                <span style="font-size: 0.95rem; font-weight: 500;">${message}</span>
            </div>
        `;

        toastContainer.appendChild(toast);

        // Trigger reflow & animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Remove after 4 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition
        }, 4000);
    }

    // ----- Download PDF Action -----
    downloadBtn.addEventListener('click', async () => {
        if (!latestAnalysisData) return;

        const originalText = downloadBtn.innerHTML;
        downloadBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generating...';
        downloadBtn.disabled = true;

        try {
            const response = await fetch('http://localhost:8000/generate_report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(latestAnalysisData)
            });

            if (!response.ok) throw new Error('Failed to generate report');

            // Handle blob download via browser API
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = `Analysis_${currentFile.name.split('.')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);

            showToast("Report generated successfully", "success");
        } catch (error) {
            showToast(error.message, "error");
        } finally {
            downloadBtn.innerHTML = originalText;
            downloadBtn.disabled = false;
        }
    });

    // ----- PAGE 2: Skill Gap Analysis -----
    async function triggerSkillGapAnalysis(missingSkills) {
        const gapLoader = document.getElementById('gapLoader');
        const roadmapContainer = document.getElementById('roadmapContainer');

        gapLoader.classList.remove('hidden');
        roadmapContainer.classList.add('hidden');

        try {
            const res = await fetch('http://localhost:8000/skill_gap_analysis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: currentRole,
                    missing_skills: missingSkills
                })
            });
            if (!res.ok) throw new Error("Failed to generate roadmap via LLM.");

            const data = await res.json();

            document.getElementById('gapMessage').textContent = data.message || "Here is a personalized learning roadmap to hit the ground running:";

            roadmapContainer.innerHTML = '';
            if (data.roadmap) {
                data.roadmap.forEach((step, index) => {
                    const div = document.createElement('div');
                    div.className = 'roadmap-step animate-fade-in';
                    div.style.animationDelay = `${index * 0.2}s`;
                    div.innerHTML = `
                            <h4>Step ${index + 1}: ${step.title}</h4>
                            <p>${step.description}</p>
                        `;
                    roadmapContainer.appendChild(div);
                });
            }

            gapLoader.classList.add('hidden');
            roadmapContainer.classList.remove('hidden');

        } catch (e) {
            showToast(e.message, "error");
            gapLoader.classList.add('hidden');
        }
    }

    // ----- PAGE 3: AI Interview Logic -----
    let currentInterviewQuestions = [];

    async function triggerAiInterview(extractedSkills) {
        const interviewLoader = document.getElementById('interviewLoader');
        const interviewChatBox = document.getElementById('interviewChatBox');
        const interviewActions = document.getElementById('interviewActions');
        const questionsContainer = document.getElementById('questionsContainer');

        interviewLoader.classList.remove('hidden');
        interviewChatBox.classList.add('hidden');
        interviewActions.classList.add('hidden');
        questionsContainer.innerHTML = '';
        currentInterviewQuestions = [];

        try {
            const res = await fetch('http://localhost:8000/start_interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: currentRole,
                    extracted_skills: extractedSkills
                })
            });
            if (!res.ok) throw new Error("Failed to generate questions via LLM.");

            const data = await res.json();
            currentInterviewQuestions = data.questions;

            currentInterviewQuestions.forEach((q, idx) => {
                const block = document.createElement('div');
                block.className = 'q-block animate-fade-in';
                block.style.animationDelay = `${idx * 0.2}s`;

                block.innerHTML = `
                        <div class="question-bubble">
                            <strong><i class="fa-solid fa-robot"></i> AI Recruiter - Q${idx + 1} of ${currentInterviewQuestions.length}</strong>
                            ${q}
                        </div>
                        <textarea class="answer-area" id="ans_${idx}" placeholder="Type your answer here..."></textarea>
                    `;
                questionsContainer.appendChild(block);
            });

            interviewLoader.classList.add('hidden');
            interviewChatBox.classList.remove('hidden');
            interviewActions.classList.remove('hidden');

        } catch (e) {
            showToast(e.message, "error");
            interviewLoader.classList.add('hidden');
        }
    }

    // Evaluate Interview Button
    document.getElementById('finishInterviewBtn')?.addEventListener('click', async () => {
        const answers = [];
        let allAnswered = true;

        for (let i = 0; i < currentInterviewQuestions.length; i++) {
            const val = document.getElementById(`ans_${i}`).value.trim();
            if (!val) allAnswered = false;
            answers.push(val || "No answer provided.");
        }

        if (!allAnswered) {
            const proceed = confirm("Some questions are unanswered! Submit anyway?");
            if (!proceed) return;
        }

        const evaluationLoader = document.getElementById('evaluationLoader');
        const finalPanel = document.getElementById('finalEvaluationPanel');
        const btn = document.getElementById('finishInterviewBtn');
        const chatBox = document.getElementById('interviewChatBox');

        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Evaluating...';
        evaluationLoader.classList.remove('hidden');
        chatBox.classList.add('hidden');
        document.getElementById('interviewActions').classList.add('hidden');

        try {
            const res = await fetch('http://localhost:8000/evaluate_interview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    role: currentRole,
                    resume_score: latestAnalysisData.resume_score,
                    questions: currentInterviewQuestions,
                    answers: answers
                })
            });
            if (!res.ok) throw new Error("Failed evaluating answers via LLM.");

            const data = await res.json();

            // Populate Final Panel
            document.getElementById('finalResumeScore').textContent = latestAnalysisData.resume_score.toFixed(1);
            document.getElementById('finalInterviewScore').textContent = data.interview_score;
            document.getElementById('finalCombinedScore').textContent = data.final_score.toFixed(1);

            document.getElementById('finalRationale').textContent = data.rationale;
            document.getElementById('finalFeedback').textContent = data.feedback;

            const badge = document.getElementById('finalDecisionBadge');
            badge.textContent = data.decision.toUpperCase();

            if (data.decision === "Selected") {
                badge.style.background = 'var(--success-bg)';
                badge.style.color = 'var(--success-color)';
                badge.style.border = '1px solid rgba(16, 185, 129, 0.3)';
            } else if (data.decision === "Hold") {
                badge.style.background = 'rgba(251, 191, 36, 0.15)';
                badge.style.color = '#fbbf24';
                badge.style.border = '1px solid rgba(251, 191, 36, 0.3)';
            } else {
                badge.style.background = 'var(--error-bg)';
                badge.style.color = 'var(--error-color)';
                badge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            }

            evaluationLoader.classList.add('hidden');
            finalPanel.classList.remove('hidden');

            showToast("Interview evaluated successfully!", "success");

        } catch (e) {
            showToast(e.message, "error");
            evaluationLoader.classList.add('hidden');
            chatBox.classList.remove('hidden');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Submit Answers for Evaluation';
        }
    });

});
