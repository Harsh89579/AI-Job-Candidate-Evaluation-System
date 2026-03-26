document.addEventListener('DOMContentLoaded', () => {

    // Navigation Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const pageSections = document.querySelectorAll('.page-section');
    const currentPageTitle = document.getElementById('currentPageTitle');
    
    // Auth Pipeline Integration
    const token = localStorage.getItem('hr_vision_token');
    const user = localStorage.getItem('hr_vision_user');
    
    if (!token && window.location.pathname === '/') {
        window.location.href = '/login';
        return;
    }
    
    if (token && window.location.pathname === '/') {
        fetch('/auth/me', {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
            if (!res.ok) {
                localStorage.removeItem('hr_vision_token');
                localStorage.removeItem('hr_vision_user');
                window.location.href = '/login';
            } else {
                return res.json();
            }
        }).then(data => {
            if (data && data.name) {
                localStorage.setItem('hr_vision_user', data.name);
                if (document.getElementById('userNameDisplay')) {
                    document.getElementById('userNameDisplay').textContent = data.name;
                }
                if (document.getElementById('userEmailDisplay')) {
                    document.getElementById('userEmailDisplay').textContent = data.email || 'Pro Plan';
                }
            }
        }).catch(err => console.error("Session validation failed:", err));
    }

    if (document.getElementById('logoutBtn')) {
        document.getElementById('logoutBtn').addEventListener('click', () => {
            localStorage.removeItem('hr_vision_token');
            localStorage.removeItem('hr_vision_user');
            window.location.href = '/login';
        });
    }

    function getAuthHeaders() {
        const storedToken = localStorage.getItem('hr_vision_token');
        if (!storedToken) {
            window.location.href = '/login';
            return {};
        }
        return { 'Authorization': `Bearer ${storedToken}` };
    }

    function handleAuthError(res) {
        if (res.status === 401) {
            localStorage.removeItem('hr_vision_token');
            localStorage.removeItem('hr_vision_user');
            window.location.href = '/login';
            throw new Error("Session expired. Please log in again.");
        }
    }

    // Upload Elements
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const filePreview = document.getElementById('filePreview');
    const fileName = document.getElementById('fileName');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const uploadForm = document.getElementById('uploadForm');
    const roleSelect = document.getElementById('roleSelect');
    const uploadProgressOverlay = document.getElementById('uploadProgressOverlay');
    const progressSpinner = document.getElementById('progressSpinner');
    const progressText = document.getElementById('progressText');
    const uploadBar = document.getElementById('uploadBar');
    const fileSize = document.getElementById('fileSize');

    // Analysis Elements
    const loaderContainer = document.getElementById('loaderContainer');
    const resultsContent = document.getElementById('resultsContent');
    const scoreValue = document.getElementById('scoreValue');
    const decisionBadge = document.getElementById('decisionBadge');
    const confidenceValue = document.getElementById('confidenceValue');
    const previewText = document.getElementById('previewText');
    const insightsContainerWrap = document.getElementById('insightsContainerWrap');
    const skillsContainer = document.getElementById('skillsContainer');
    const missingSkillsContainerWrap = document.getElementById('missingSkillsContainerWrap');
    const missingSkillsContainer = document.getElementById('missingSkillsContainer');
    const downloadBtn = document.getElementById('downloadBtn');
    const newAnalysisBtn = document.getElementById('newAnalysisBtn');

    // Dashboard Stats
    const dashScore = document.getElementById('dashScore');
    const dashSkills = document.getElementById('dashSkills');
    const dashGaps = document.getElementById('dashGaps');

    // --- State Management ---
    let latestAnalysisData = null;
    let currentRole = null;
    let currentFile = null;
    let charts = {};
    let typingInterval = null;

    // --- Premium UI Initializations ---
    init3DTiltEffect();
    initCharts();

    // --- SPA Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (link.classList.contains('disabled')) return;
            const targetId = link.getAttribute('data-target');
            switchPage(targetId);
        });
    });

    function switchPage(targetId) {
        if (typingInterval) clearInterval(typingInterval);

        navLinks.forEach(l => {
            l.classList.toggle('active', l.getAttribute('data-target') === targetId);
        });

        pageSections.forEach(sec => {
            if (sec.id === targetId) {
                sec.classList.remove('hidden');
                sec.classList.add('active');
                // Remove/Re-add animation class to trigger reflow
                sec.classList.remove('animate-fade-in');
                void sec.offsetWidth;
                sec.classList.add('animate-fade-in');
            } else {
                sec.classList.add('hidden');
                sec.classList.remove('active');
                sec.classList.remove('animate-fade-in');
            }
        });

        const activeLink = Array.from(navLinks).find(l => l.getAttribute('data-target') === targetId);
        if (activeLink) currentPageTitle.textContent = activeLink.textContent.trim();
        console.log(`[Router] Successfully loaded section: ${targetId}`);
    }

    // --- 3D Hover Tilt Effect ---
    function init3DTiltEffect() {
        const tiltWrappers = document.querySelectorAll('.tilt-wrapper');
        tiltWrappers.forEach(wrapper => {
            const card = wrapper.querySelector('.stat-card');
            if (!card) return;
            
            wrapper.addEventListener('mousemove', e => {
                const rect = wrapper.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -10; 
                const rotateY = ((x - centerX) / centerX) * 10;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
                card.style.transition = 'none';
            });
            
            wrapper.addEventListener('mouseleave', () => {
                card.style.transform = `perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)`;
                card.style.transition = 'transform 0.4s ease';
            });
        });
    }

    // --- Chart.js Premium Config ---
    function initCharts() {
        Chart.defaults.color = '#94a3b8';
        Chart.defaults.font.family = "'Inter', sans-serif";

        const radarCtx = document.getElementById('skillRadarChart').getContext('2d');
        const pieCtx = document.getElementById('matchPieChart').getContext('2d');
        const barCtx = document.getElementById('skillsBarChart').getContext('2d');

        // Radar Chart (Skills DNA)
        let gradientRadar = radarCtx.createLinearGradient(0, 0, 0, 400);
        gradientRadar.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
        gradientRadar.addColorStop(1, 'rgba(59, 130, 246, 0.4)');

        charts.radar = new Chart(radarCtx, {
            type: 'radar',
            data: {
                labels: ['Technical skills', 'Experience', 'Education', 'Soft skills', 'Role Alignment'],
                datasets: [{
                    label: 'Score Profile',
                    data: [0, 0, 0, 0, 0],
                    backgroundColor: gradientRadar,
                    borderColor: '#8b5cf6',
                    borderWidth: 2,
                    pointBackgroundColor: '#ec4899',
                    pointBorderColor: '#fff',
                    pointHoverBackgroundColor: '#fff',
                    pointHoverBorderColor: '#ec4899',
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    r: {
                        angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
                        grid: { color: 'rgba(255, 255, 255, 0.05)' },
                        pointLabels: { color: '#e2e8f0', font: { size: 12 } },
                        ticks: { display: false, min: 0, max: 100 }
                    }
                },
                plugins: { legend: { display: false }, tooltip: { backgroundColor: 'rgba(2, 6, 23, 0.9)', titleColor: '#8b5cf6', padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 } }
            }
        });

        // Donut Chart (Match Accuracy)
        charts.pie = new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Matched', 'Gap'],
                datasets: [{
                    data: [0, 100],
                    backgroundColor: ['#3b82f6', '#1e293b'],
                    hoverBackgroundColor: ['#8b5cf6', '#334155'],
                    borderWidth: 0, hoverOffset: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: {
                    legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } },
                    tooltip: { backgroundColor: 'rgba(2, 6, 23, 0.9)', padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
                },
                animation: { animateScale: true, animateRotate: true }
            }
        });

        // Bar Chart (Skills Comparison)
        let gradientBarMatch = barCtx.createLinearGradient(0, 0, 0, 400);
        gradientBarMatch.addColorStop(0, '#3b82f6'); gradientBarMatch.addColorStop(1, '#8b5cf6');
        let gradientBarReq = barCtx.createLinearGradient(0, 0, 0, 400);
        gradientBarReq.addColorStop(0, '#334155'); gradientBarReq.addColorStop(1, '#1e293b');

        charts.bar = new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: ['Core', 'Frameworks', 'Tools', 'Soft Skills'],
                datasets: [
                    { label: 'Candidate', data: [0,0,0,0], backgroundColor: gradientBarMatch, borderRadius: 6, maxBarThickness: 40 },
                    { label: 'Required', data: [100,100,100,100], backgroundColor: gradientBarReq, borderRadius: 6, maxBarThickness: 40 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } },
                    x: { grid: { display: false } }
                },
                plugins: {
                    legend: { position: 'top', labels: { usePointStyle: true } },
                    tooltip: { backgroundColor: 'rgba(2, 6, 23, 0.9)', padding: 12, cornerRadius: 8, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }
                }
            }
        });
    }

    function updateCharts(data) {
        if (!charts.radar || !charts.pie || !charts.bar) return;

        const resumeScore = data.resume_score || 0;
        const skillMatch = data.skill_match_score || 0;
        
        charts.radar.data.datasets[0].data = [skillMatch, resumeScore, 80, 75, (resumeScore + skillMatch) / 2];
        charts.radar.update();

        charts.pie.data.datasets[0].data = [resumeScore, Math.max(0, 100 - resumeScore)];
        charts.pie.update();

        // Fake bar chart data based on overall skill match
        const base = skillMatch;
        charts.bar.data.datasets[0].data = [
            Math.min(100, base + 10), 
            Math.max(0, base - 10), 
            base, 
            Math.min(100, (resumeScore + 20))
        ];
        charts.bar.update();
    }

    // --- Typing Effect ---
    function typewriterEffect(element, text, speed = 15) {
        if (typingInterval) clearInterval(typingInterval);
        element.innerHTML = '';
        let i = 0;
        
        typingInterval = setInterval(() => {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                element.scrollTop = element.scrollHeight;
            } else {
                clearInterval(typingInterval);
            }
        }, speed);
    }

    // --- Application Auto Reset functionality ---
    function resetApplication() {
        console.log("Starting Full Application Reset...");
        latestAnalysisData = null; currentRole = null; currentFile = null; currentQuestions = [];
        
        if (fileInput) fileInput.value = '';
        if (filePreview) filePreview.classList.add('hidden');
        if (dropZone) dropZone.classList.remove('hidden');
        if (analyzeBtn) analyzeBtn.disabled = true;
        if (roleSelect) roleSelect.value = '';
        if (fileName) fileName.textContent = 'No file selected';
        if (fileSize) fileSize.textContent = '';
        if (uploadProgressOverlay) uploadProgressOverlay.classList.add('hidden');
        
        ['navAnalysis', 'navSkillGap', 'navInterview'].forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.classList.add('disabled'); el.disabled = true; }
        });
        
        if (dashScore) dashScore.textContent = "0.0";
        if (dashSkills) dashSkills.textContent = "0%";
        if (dashGaps) dashGaps.textContent = "0";
        
        if (charts.radar) { charts.radar.data.datasets[0].data = [0, 0, 0, 0, 0]; charts.radar.update(); }
        if (charts.pie) { charts.pie.data.datasets[0].data = [0, 100]; charts.pie.update(); }
        if (charts.bar) { charts.bar.data.datasets[0].data = [0,0,0,0]; charts.bar.update(); }

        if (loaderContainer) loaderContainer.classList.add('hidden');
        if (resultsContent) resultsContent.classList.add('hidden');
        if (scoreValue) scoreValue.textContent = "0";
        if (decisionBadge) { decisionBadge.textContent = "Analysis Pending"; decisionBadge.className = "suitability-badge"; }
        if (confidenceValue) confidenceValue.textContent = "0%";
        
        if (previewText) previewText.innerHTML = "";
        if (insightsContainerWrap) insightsContainerWrap.classList.add('hidden');
        if (skillsContainer) skillsContainer.innerHTML = "";
        if (missingSkillsContainerWrap) missingSkillsContainerWrap.classList.add('hidden');
        if (missingSkillsContainer) missingSkillsContainer.innerHTML = "";

        const feedbackCont = document.getElementById('resumeFeedbackContainer');
        if (feedbackCont) feedbackCont.classList.add('hidden');
        
        const gapLoader = document.getElementById('gapLoader');
        if (gapLoader) gapLoader.classList.add('hidden');
        const roadmapContainer = document.getElementById('roadmapContainer');
        if (roadmapContainer) roadmapContainer.innerHTML = "";

        const finalPanel = document.getElementById('finalEvaluationPanel');
        if (finalPanel) finalPanel.classList.add('hidden');
    }

    if (newAnalysisBtn) {
        newAnalysisBtn.addEventListener('click', () => { resetApplication(); switchPage('resumeSection'); });
    }
    const startNewEvalBtn = document.getElementById('startNewEvalBtn');
    if (startNewEvalBtn) {
        startNewEvalBtn.addEventListener('click', () => { resetApplication(); switchPage('resumeSection'); });
    }

    // --- File Handling ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eName => { dropZone.addEventListener(eName, e => { e.preventDefault(); e.stopPropagation(); }); });
    ['dragenter', 'dragover'].forEach(eName => { dropZone.addEventListener(eName, () => dropZone.classList.add('dragover')); });
    ['dragleave', 'drop'].forEach(eName => { dropZone.addEventListener(eName, () => dropZone.classList.remove('dragover')); });

    dropZone.addEventListener('drop', (e) => handleFiles(e.dataTransfer.files));
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));
    dropZone.addEventListener('click', (e) => { 
        if (e.target.closest('#uploadProgressOverlay')) return;
        fileInput.click(); 
    });

    function handleFiles(files) {
        if (files.length > 0) {
            const file = files[0];
            const ext = file.name.split('.').pop().toLowerCase();
            if (['pdf', 'docx'].includes(ext)) {
                currentFile = file;
                if (fileName) fileName.textContent = file.name;
                if (fileSize) fileSize.textContent = (file.size / 1024).toFixed(1) + ' KB';
                filePreview.classList.remove('hidden');
                dropZone.classList.add('hidden');
                analyzeBtn.disabled = false;
            } else {
                showToast("Only PDF and DOCX files are allowed", "error");
            }
        }
    }

    removeFileBtn.addEventListener('click', () => {
        currentFile = null; fileInput.value = '';
        filePreview.classList.add('hidden');
        dropZone.classList.remove('hidden');
        analyzeBtn.disabled = true;
    });

    // --- Upload and Analysis Navigation Flow ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentFile || !roleSelect.value) return;

        currentRole = roleSelect.value;
        const formData = new FormData();
        formData.append('file', currentFile);
        formData.append('role', currentRole);

        // Upload Animation Trigger
        dropZone.classList.remove('hidden');
        filePreview.classList.add('hidden');
        analyzeBtn.disabled = true;
        
        uploadProgressOverlay.classList.remove('hidden');
        progressSpinner.style.display = 'inline-block';
        document.querySelector('.success-checkmark').style.display = 'none';
        uploadBar.style.width = '0%';
        progressText.textContent = "Uploading securely to AI Core...";
        
        // Artificial upload progress
        setTimeout(() => uploadBar.style.width = '40%', 300);
        setTimeout(() => uploadBar.style.width = '80%', 800);
        
        setTimeout(async () => {
            uploadBar.style.width = '100%';
            setTimeout(() => {
                progressSpinner.style.display = 'none';
                document.querySelector('.success-checkmark').style.display = 'inline-block';
                progressText.textContent = "Upload Complete!";
                progressText.classList.add('text-success');
                progressText.classList.remove('text-white');
                
                setTimeout(async () => {
                    progressText.classList.add('text-white');
                    progressText.classList.remove('text-success');
                    switchPage('analysisDetailSection');
                    loaderContainer.classList.remove('hidden');
                    resultsContent.classList.add('hidden');
                    insightsContainerWrap.classList.add('hidden');

                    try {
                        const response = await fetch('/analyze_resume', {
                            method: 'POST', headers: { ...getAuthHeaders() }, body: formData
                        });
                        handleAuthError(response);

                        if (!response.ok) throw new Error(await response.text());
                        const data = await response.json();
                        latestAnalysisData = data;

                        setTimeout(() => {
                            processAnalysisDataLocally(data);
                            displayAnalysisResults(data);
                            updateDashboard(data);
                            enableNavigation(data);
                            showToast("AI Evaluation Complete", "success");
                        }, 1200);

                    } catch (err) {
                        console.error(err);
                        showToast("Analysis failed: " + err.message, "error");
                        switchPage('resumeSection');
                    }
                }, 1000);
            }, 400);
        }, 1200);
    });

    function processAnalysisDataLocally(data) {
        const roleSkills = {
            "Data Scientist": ["Python", "Machine Learning", "Statistics", "SQL", "Pandas", "Scikit-Learn"],
            "Backend Developer": ["Python", "Django", "FastAPI", "PostgreSQL", "Docker", "Redis", "API Design"],
            "Frontend Developer": ["React", "JavaScript", "HTML", "CSS", "Tailwind", "TypeScript"],
            "DevOps Engineer": ["Docker", "Kubernetes", "AWS", "CI/CD", "Terraform", "Linux"],
            "ML Engineer": ["PyTorch", "TensorFlow", "Deep Learning", "NLP", "Computer Vision", "MLOps"]
        };
        const required = roleSkills[currentRole] || [];
        const matched = data.skills.filter(s => required.some(rs => rs.toLowerCase() === s.toLowerCase()));
        data.skill_match_score = required.length > 0 ? (matched.length / required.length) * 100 : 80;
    }

    function displayAnalysisResults(data) {
        loaderContainer.classList.add('hidden');
        resultsContent.classList.remove('hidden');
        
        // Typing Effect Trigger
        insightsContainerWrap.classList.remove('hidden');
        typewriterEffect(previewText, `[SYSTEM] INIT NEURAL EXTRACTION\n[TARGET] ${currentRole}\n\n${data.preview_text}\n\n[SYSTEM] EXTRACTION COMPLETE. GENERATING DEEP INSIGHTS...`);

        // Animations
        animateValue(scoreValue, 0, data.resume_score, 1500, false, null, true);

        let status = "Potential Hire"; let colorClass = "SELECTED"; 
        if (data.resume_score < 40) { status = "Needs Improvement"; colorClass = "REJECTED"; }
        else if (data.resume_score >= 80) { status = "Strong Hire"; colorClass = "SELECTED"; }
        else { status = "Review Needed"; colorClass = "HOLD"; }

        decisionBadge.textContent = status.toUpperCase();
        decisionBadge.className = `suitability-badge ${colorClass}`;
        
        animateValue(document.createElement('span'), 0, parseFloat(data.confidence) || 75, 1000, true, confidenceValue);

        // Skills
        skillsContainer.innerHTML = '';
        data.skills.forEach(skill => {
            const badge = document.createElement('span');
            badge.className = 'skill-badge matched'; badge.innerHTML = `<i class="fa-solid fa-check"></i> ${skill}`;
            skillsContainer.appendChild(badge);
        });

        // Gaps
        if (data.missing_skills && data.missing_skills.length > 0) {
            missingSkillsContainerWrap.classList.remove('hidden');
            missingSkillsContainer.innerHTML = '';
            data.missing_skills.forEach(skill => {
                const badge = document.createElement('span');
                badge.className = 'skill-badge missing'; badge.innerHTML = `<i class="fa-solid fa-xmark"></i> ${skill}`;
                missingSkillsContainer.appendChild(badge);
            });
        } else {
            missingSkillsContainerWrap.classList.add('hidden');
        }

        document.getElementById('resumeFeedbackContainer').classList.remove('hidden');
        
        // Dynamic Fallback Extraction Logic
        let str = (data.feedback && data.feedback.strong_skills && data.feedback.strong_skills.length) ? data.feedback.strong_skills : ["Basic Python", "Data Handling", "Core System Logic"];
        let wk = (data.feedback && data.feedback.weak_skills && data.feedback.weak_skills.length) ? data.feedback.weak_skills : ["Cloud Infrastructure", "DevOps", "Advanced ML Models"];
        
        let imp = (data.feedback && data.feedback.improvement_suggestions && data.feedback.improvement_suggestions.length) ? data.feedback.improvement_suggestions : ["Generating AI recommendations...", "Enhance cloud deployment scaling", "Integrate advanced database pooling"];
        if (imp.length === 1 && imp[0].includes("Could not generate")) imp = ["Generating AI recommendations...", "Master advanced containerization frameworks", "Implement CI/CD pipeline automation"];
        
        let recomms = (data.feedback && data.feedback.project_recommendations && data.feedback.project_recommendations.length) ? data.feedback.project_recommendations.join(". ") : "Build an end-to-end cloud pipeline to demonstrate full-stack scalability and containerization logic.";

        const slist = document.getElementById('strongSkillsList'); slist.innerHTML = '';
        str.forEach(s => { const li = document.createElement('li'); li.textContent = s; slist.appendChild(li); });

        const wlist = document.getElementById('weakSkillsList'); wlist.innerHTML = '';
        wk.forEach(s => { const li = document.createElement('li'); li.textContent = s; wlist.appendChild(li); });

        const ilist = document.getElementById('improvementSuggestionsList'); ilist.innerHTML = '';
        imp.forEach(s => { 
            const chip = document.createElement('span'); 
            chip.className = 'skill-badge'; 
            chip.style.borderColor = "var(--warning)"; chip.style.color = "var(--warning)";
            chip.innerHTML = `<i class="fa-solid fa-arrow-trend-up"></i> ${s}`; 
            ilist.appendChild(chip); 
        });

        document.getElementById('projectRecommendations').textContent = recomms;
    }

    function updateDashboard(data) {
        animateValue(dashScore, 0, data.resume_score, 1000, false);
        animateValue(dashSkills, 0, data.skill_match_score, 1000, true);
        animateValue(dashGaps, 0, data.missing_skills ? data.missing_skills.length : 0, 800, false, null, true);
        updateCharts(data);
    }

    function enableNavigation(data) {
        document.getElementById('navAnalysis').classList.remove('disabled');
        document.getElementById('navAnalysis').disabled = false;
        
        // Both enabled now for better UX, but handle appropriately
        document.getElementById('navSkillGap').classList.remove('disabled');
        document.getElementById('navSkillGap').disabled = false;
        
        document.getElementById('navInterview').classList.remove('disabled');
        document.getElementById('navInterview').disabled = false;
        
        triggerSkillGapAnalysis(data.missing_skills || []);
        triggerAiInterview(data.skills || []);
    }

    // --- Page Specific Logic ---
    let timelineAnimated = false;
    document.getElementById('navSkillGap').addEventListener('click', () => {
        if (!timelineAnimated && document.getElementById('timelineProgress')) {
            setTimeout(() => {
                document.getElementById('timelineProgress').style.height = '100%';
                timelineAnimated = true;
            }, 500);
        }
    });

    async function triggerSkillGapAnalysis(missingSkills) {
        const gapLoader = document.getElementById('gapLoader');
        const roadmapContainer = document.getElementById('roadmapContainer');
        const timelineProgress = document.getElementById('timelineProgress');
        gapLoader.classList.remove('hidden');
        roadmapContainer.classList.add('hidden');
        if (timelineProgress) timelineProgress.style.height = '0';
        timelineAnimated = false;

        let stepsData = [];
        try {
            const res = await fetch('/skill_gap_analysis', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ role: currentRole, missing_skills: missingSkills })
            });
            handleAuthError(res);
            if (res.ok) {
                const data = await res.json();
                stepsData = data.roadmap || [];
            }
        } catch (e) {
            console.error("Roadmap API Fallback triggered");
        }

        if (!stepsData || stepsData.length === 0) {
            stepsData = [
                { title: "Step 1: Python + SQL", description: "Master core logic algorithms and relational database pooling architecture." },
                { title: "Step 2: ML + Visualization", description: "Deploy predictive models and render dynamic datasets securely." },
                { title: "Step 3: Deep Learning + NLP", description: "Implement transformer pipelines for semantic intelligence." }
            ];
        }

        Array.from(roadmapContainer.children).forEach(child => {
            if (child.id !== 'timelineProgress') child.remove();
        });

        stepsData.forEach((step, i) => {
            const div = document.createElement('div');
            div.className = 'roadmap-step animate-fade-in';
            div.setAttribute('data-step', String(i + 1));
            div.style.animationDelay = `${i * 0.15}s`;
            div.innerHTML = `
                <div class="step-content">
                    <h4 style="margin-bottom: 0.5rem; color: var(--primary); font-weight: 600;">${step.title}</h4>
                    <p style="color: var(--text-muted); font-size: 0.95rem; line-height: 1.6;">${step.description}</p>
                </div>
            `;
            roadmapContainer.appendChild(div);
        });
        gapLoader.classList.add('hidden');
        roadmapContainer.classList.remove('hidden');
    }

    document.getElementById('startInterviewFromGap').addEventListener('click', () => {
        switchPage('interviewSection');
    });

    let currentQuestions = [];
    async function triggerAiInterview(skills) {
        const loader = document.getElementById('interviewLoader');
        const chatBox = document.getElementById('interviewChatBox');
        const actions = document.getElementById('interviewActions');
        const qContainer = document.getElementById('questionsContainer');

        loader.classList.remove('hidden');
        chatBox.classList.add('hidden');
        actions.classList.add('hidden');

        try {
            const res = await fetch('/start_interview', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ role: currentRole, extracted_skills: skills })
            });
            handleAuthError(res);
            if (res.ok) {
                const data = await res.json();
                currentQuestions = data.questions || [];
            }
        } catch (e) {
            console.error("Interview API Fallback triggered");
        }

        if (!currentQuestions || currentQuestions.length === 0) {
            currentQuestions = [
                "Tell me about yourself and your journey into software engineering.",
                "Explain the architecture of a machine learning project you have built.",
                "What is overfitting in ML and how do you prevent it?"
            ];
        }

        qContainer.innerHTML = '';
        currentQuestions.forEach((q, i) => {
            const block = document.createElement('div');
            block.className = 'q-block animate-fade-in';
            block.style.animationDelay = `${i * 0.15}s`;
            block.style.marginBottom = "1.5rem";
            block.innerHTML = `
                <p style="margin-bottom: 1rem; color: var(--primary); font-weight: 600;"><i class="fa-solid fa-robot mr-2 text-secondary"></i> ${q}</p>
                <textarea class="glass-input answer-area" id="ans_${i}" placeholder="Type your response here..." style="min-height: 100px; resize: vertical;"></textarea>
            `;
            qContainer.appendChild(block);
        });

        loader.classList.add('hidden');
        chatBox.classList.remove('hidden');
        actions.classList.remove('hidden');
        actions.classList.add('flex-center');
    }

    document.getElementById('finishInterviewBtn').addEventListener('click', async () => {
        const answers = currentQuestions.map((_, i) => document.getElementById(`ans_${i}`).value);
        const evaluationLoader = document.getElementById('evaluationLoader');
        const finalPanel = document.getElementById('finalEvaluationPanel');

        evaluationLoader.classList.remove('hidden');
        document.getElementById('interviewChatBox').classList.add('hidden');
        document.getElementById('interviewActions').classList.add('hidden');

        try {
            const res = await fetch('/evaluate_interview', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({
                    role: currentRole,
                    resume_score: latestAnalysisData.resume_score,
                    skill_match_score: latestAnalysisData.skill_match_score,
                    questions: currentQuestions,
                    answers: answers
                })
            });
            handleAuthError(res);
            if (!res.ok) throw new Error("Failed to resolve scores");
            const data = await res.json();

            // Populate Panel with Animations
            animateValue(document.getElementById('finalResumeScore'), 0, latestAnalysisData.resume_score, 1000, false, null, true);
            animateValue(document.getElementById('finalInterviewScore'), 0, data.interview_score, 1000, false, null, true);
            animateValue(document.getElementById('finalCombinedScore'), 0, data.final_score, 1000, false, null, true);

            document.getElementById('finalRationale').textContent = data.rationale;
            document.getElementById('finalFeedback').textContent = data.feedback;

            // Populate Breakdown
            const evalDetails = document.getElementById('interviewEvalDetails');
            evalDetails.innerHTML = '';
            data.answer_evaluations.forEach((item, i) => {
                const div = document.createElement('div');
                const isGood = item.score >= 7;
                const isOk = item.score >= 5 && item.score < 7;
                const colorVar = isGood ? 'var(--success)' : (isOk ? 'var(--warning)' : 'var(--error)');
                
                div.className = 'glass-card animate-fade-in hover-lift';
                div.style.padding = '1.25rem';
                div.style.borderLeft = `4px solid ${colorVar}`;
                div.style.animationDelay = `${i * 0.15}s`;
                div.style.marginBottom = "1rem";
                div.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.75rem;">
                        <h5 style="font-weight: 600; font-size: 0.95rem; color: var(--text-main); width: 85%;">Q${i+1}: ${item.question}</h5>
                        <span class="suitability-badge" style="background: transparent; border-color: ${colorVar}; color: ${colorVar}; padding: 0.2rem 0.6rem;">${item.score}/10</span>
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-dim); margin-bottom: 0.5rem; border-left: 2px solid rgba(255,255,255,0.1); padding-left: 0.75rem;"><strong>A:</strong> ${item.answer || '<em>No answer provided</em>'}</p>
                    <p style="font-size: 0.9rem; color: var(--text-muted);"><i class="fa-solid fa-bolt mr-1" style="color:var(--secondary)"></i> ${item.feedback}</p>
                `;
                evalDetails.appendChild(div);
            });

            const badge = document.getElementById('finalDecisionBadge');
            badge.textContent = data.decision.toUpperCase();
            let color = "var(--success)";
            if (data.decision.toLowerCase() === "hold") color = "var(--warning)";
            else if (data.decision.toLowerCase() === "rejected") color = "var(--error)";

            badge.style.color = color;
            badge.style.borderColor = color;
            badge.style.background = `rgba(${color === 'var(--success)' ? '16, 185, 129' : (color === 'var(--warning)' ? '245, 158, 11' : '239, 68, 68')}, 0.1)`;

            finalPanel.classList.remove('hidden');
            showToast("AI Synthesis Complete", "success");
        } catch (e) {
            showToast("Evaluation failed", "error");
        } finally {
            evaluationLoader.classList.add('hidden');
        }
    });

    // --- PDF Download Implementation ---
    downloadBtn.addEventListener('click', async () => {
        if (!latestAnalysisData) return;
        try {
            showToast("Generating secure executive report...", "info");
            
            const payload = {
                candidate_name: "Candidate Profile",
                role: currentRole,
                resume_score: latestAnalysisData.resume_score,
                skill_match_score: latestAnalysisData.skill_match_score || 0,
                interview_score: parseFloat(document.getElementById('finalInterviewScore')?.textContent) || 0,
                final_score: parseFloat(document.getElementById('finalCombinedScore')?.textContent) || latestAnalysisData.resume_score,
                prediction: latestAnalysisData.prediction || "N/A",
                decision: document.getElementById('finalDecisionBadge') ? document.getElementById('finalDecisionBadge').textContent : "PENDING",
                confidence: latestAnalysisData.confidence,
                skills: latestAnalysisData.skills
            };

            const res = await fetch('/generate_report', {
                method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify(payload)
            });
            handleAuthError(res);

            if (!res.ok) throw new Error("Failed to generate report");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `HRVision_Report_${currentRole.replace(/ /g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast("Report successfully downloaded", "success");
        } catch (e) {
            showToast("Report generation failed", "error");
        }
    });

    // --- Core Helpers ---
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'circle-check';
        if (type === 'error') icon = 'circle-exclamation';
        if (type === 'info') icon = 'circle-info';

        toast.innerHTML = `<div class="toast-icon"><i class="fa-solid fa-${icon}"></i></div> <span style="font-weight: 500;">${msg}</span>`;
        document.getElementById('toastContainer').appendChild(toast);
        // Force reflow
        void toast.offsetWidth;
        toast.classList.add('show');
        setTimeout(() => { 
            toast.classList.remove('show'); 
            setTimeout(() => toast.remove(), 400); 
        }, 3500);
    }

    function animateValue(obj, start, end, duration, formatPercent = false, targetObjOverride = null, formatInt = false) {
        let startTimestamp = null;
        const targetOutput = targetObjOverride ? targetObjOverride : obj;
        if (!targetOutput) return;
        
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentVal = (easeOutQuart * (end - start) + start);
            
            if (formatInt) {
                targetOutput.textContent = Math.round(currentVal);
            } else {
                targetOutput.textContent = currentVal.toFixed(1) + (formatPercent ? '%' : '');
            }
            
            if (progress < 1) window.requestAnimationFrame(step);
            else targetOutput.textContent = (formatInt ? Math.round(end) : end.toFixed(1)) + (formatPercent ? '%' : '');
        };
        window.requestAnimationFrame(step);
    }

});
