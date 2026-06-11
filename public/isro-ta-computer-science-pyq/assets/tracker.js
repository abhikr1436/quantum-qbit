(function() {
    // Generate a unique session ID for this mock test attempt
    const sessionId = 'mock_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11);
    let startRecorded = false;
    let submitRecorded = false;

    // Helper to log locally in dev fallback
    function saveToLocalStorage(data, action) {
        try {
            const attempts = JSON.parse(localStorage.getItem('quantum_mock_attempts') || '[]');
            const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

            if (action === 'start') {
                // Check if already exists
                const exists = attempts.some(a => a.session_id === data.session_id);
                if (!exists) {
                    attempts.unshift({
                        session_id: data.session_id,
                        candidate_name: data.candidate_name,
                        roll_number: data.roll_number,
                        test_name: data.test_name,
                        start_time: now,
                        submitted: false,
                        marks: null,
                        total_marks: null,
                        time_spent: null,
                        submitted_at: null
                    });
                }
            } else if (action === 'submit') {
                const index = attempts.findIndex(a => a.session_id === data.session_id);
                if (index !== -1) {
                    attempts[index].submitted = true;
                    attempts[index].marks = data.marks;
                    attempts[index].total_marks = data.total_marks;
                    attempts[index].time_spent = data.time_spent;
                    attempts[index].submitted_at = now;
                } else {
                    // Prepend a new submitted entry if start wasn't found
                    attempts.unshift({
                        session_id: data.session_id,
                        candidate_name: 'Unknown Candidate',
                        roll_number: 'N/A',
                        test_name: 'ISRO Mock Test',
                        start_time: now,
                        submitted: true,
                        marks: data.marks,
                        total_marks: data.total_marks,
                        time_spent: data.time_spent,
                        submitted_at: now
                    });
                }
            }
            localStorage.setItem('quantum_mock_attempts', JSON.stringify(attempts));
        } catch (e) {
            console.error('Failed to write mock attempt to LocalStorage:', e);
        }
    }

    // Record when candidate officially starts the exam
    function recordStart() {
        if (startRecorded) return;
        startRecorded = true;

        const candidateName = (document.getElementById('session-candidate-name')?.textContent || 
                               document.getElementById('candidate-name')?.value || 
                               'Unknown Candidate').trim();
        const rollNumber = (document.getElementById('session-candidate-roll')?.textContent || 'N/A').trim();
        const testName = (document.getElementById('current-test-name')?.textContent || 'ISRO CS Mock Test').trim();

        const payload = {
            action: 'start',
            session_id: sessionId,
            candidate_name: candidateName,
            roll_number: rollNumber,
            test_name: testName
        };

        // Always save to localStorage as local dev/testing fallback
        saveToLocalStorage(payload, 'start');

        // Post to backend API
        fetch('/api/mock_test_tracker.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.warn('Backend warning recording start:', data.error);
            }
        })
        .catch(err => {
            console.log('Backend offline or error, using LocalStorage fallback:', err);
        });
    }

    // Record when candidate submits the exam
    function recordSubmit() {
        if (submitRecorded) return;
        submitRecorded = true;

        // Try reading elements in results view
        const marksObtained = parseInt(document.getElementById('results-marks-obtained')?.textContent || 
                                       document.getElementById('results-score-value')?.textContent || 
                                       '0', 10);
        const totalMarks = parseInt(document.getElementById('results-total-marks')?.textContent || '80', 10);
        const timeSpent = (document.getElementById('results-time-spent')?.textContent || 'N/A').trim();

        const payload = {
            action: 'submit',
            session_id: sessionId,
            marks: marksObtained,
            total_marks: totalMarks,
            time_spent: timeSpent
        };

        // Always save to localStorage as local dev/testing fallback
        saveToLocalStorage(payload, 'submit');

        // Post to backend API
        fetch('/api/mock_test_tracker.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                console.warn('Backend warning recording submit:', data.error);
            }
        })
        .catch(err => {
            console.log('Backend offline or error, using LocalStorage fallback:', err);
        });
    }

    // Observe active views using MutationObserver
    function setupObserver() {
        const examView = document.getElementById('exam-view');
        const resultsView = document.getElementById('results-view');

        if (!examView || !resultsView) return;

        const observerCallback = function(mutationsList) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    const isActive = target.classList.contains('active');
                    
                    if (isActive) {
                        if (target.id === 'exam-view') {
                            recordStart();
                        } else if (target.id === 'results-view') {
                            recordSubmit();
                        }
                    }
                }
            }
        };

        const observer = new MutationObserver(observerCallback);
        observer.observe(examView, { attributes: true, attributeFilter: ['class'] });
        observer.observe(resultsView, { attributes: true, attributeFilter: ['class'] });
    }

    // Start polling to wait for DOM components to render
    const startInterval = setInterval(() => {
        if (document.getElementById('exam-view') && document.getElementById('results-view')) {
            clearInterval(startInterval);
            setupObserver();
        }
    }, 200);

})();
