        document.addEventListener('DOMContentLoaded', () => {
            // --- DOM ELEMENT REFERENCES ---
            const skyCanvas = document.getElementById('skyCanvas');
            const skyCtx = skyCanvas.getContext('2d');
            const analogClockCanvas = document.getElementById('analogClockCanvas');
            const analogCtx = analogClockCanvas.getContext('2d');
            const timeInput = document.getElementById('timeInput');
            const dayInput = document.getElementById('dayInput');
            const monthSelect = document.getElementById('monthSelect');
            const monthSlider = document.getElementById('monthSlider');
            const latitudeSlider = document.getElementById('latitudeSlider');
            const latitudeValue = document.getElementById('latitudeValue');
            const showDetailsCheckbox = document.getElementById('showDetails');
            const systemClockBtn = document.getElementById('systemClockBtn');
            const resetBtn = document.getElementById('resetBtn');
            const animationBtn = document.getElementById('animationBtn');
            const animationSpeedSlider = document.getElementById('animationSpeed');

            // --- STATE ---
            let currentDate = new Date();
            let latitude = 40;
            let isAnimating = false;
            let animationFrameId;
            let isDraggingHour = false;
            let isDraggingMinute = false;
            let animationSpeed = 10; // minutes per frame

            // --- STAR DATA ---
            const starData = {
                littleDipper: { name: "Little Dipper", stars: [{ x: 0, y: 0, name: "Polaris" }, { x: -3, y: -6 }, { x: -5, y: -11 }, { x: -6, y: -17 }, { x: -10, y: -16 }, { x: -12, y: -11 }, { x: -8, y: -8 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 2]] },
                bigDipper: { name: "Big Dipper", stars: [{ x: 18, y: -35 }, { x: 25, y: -30 }, { x: 32, y: -26 }, { x: 37, y: -17 }, { x: 48, y: -18, name: "Dubhe" }, { x: 45, y: -10, name: "Merak" }, { x: 35, y: -8 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]] },
                cassiopeia: { name: "Cassiopeia", stars: [{ x: -25, y: 25 }, { x: -35, y: 28 }, { x: -32, y: 35 }, { x: -40, y: 40 }, { x: -38, y: 48 }], lines: [[0, 1], [1, 2], [2, 3], [3, 4]] }
            };
            
            // --- DRAWING & ANIMATION ---
            function mainLoop() {
                if (isAnimating) {
                    currentDate.setMinutes(currentDate.getMinutes() + animationSpeed);
                }
                updateUI();
                animationFrameId = requestAnimationFrame(mainLoop);
            }

            function drawSky() {
                const width = skyCanvas.width;
                const height = skyCanvas.height;
                const polarisYFraction = 0.9 - (latitude / 90) * 0.8;
                const centerY = height * polarisYFraction;
                const centerX = width / 2;
                const scale = width / 150; 

                const hours = currentDate.getHours() + currentDate.getMinutes() / 60;
                const skyGradient = skyCtx.createLinearGradient(0, 0, 0, height);
                if (hours > 5 && hours < 20) { // Daytime (extended hours for smoother transition)
                    // Muted blue-gray to light blue gradient to match reference
                    skyGradient.addColorStop(0, '#82a3c8'); 
                    skyGradient.addColorStop(0.8, '#a7c0dc');
                } else { // Nighttime
                    skyGradient.addColorStop(0, '#000033'); 
                    skyGradient.addColorStop(0.7, '#000020'); 
                    skyGradient.addColorStop(1, '#000000');
                }
                skyCtx.fillStyle = skyGradient;
                skyCtx.fillRect(0, 0, width, height);

                const horizonY = height * 0.95;
                const groundGradient = skyCtx.createLinearGradient(0, horizonY, 0, height);
                groundGradient.addColorStop(0, '#9ACD32'); // YellowGreen
                groundGradient.addColorStop(1, '#6B8E23'); // OliveDrab
                skyCtx.fillStyle = groundGradient;
                skyCtx.beginPath();
                skyCtx.moveTo(0, height);
                skyCtx.lineTo(0, horizonY);
                skyCtx.quadraticCurveTo(width / 2, horizonY - 40, width, horizonY);
                skyCtx.lineTo(width, height);
                skyCtx.closePath();
                skyCtx.fill();

                const siderealHours = hours * 1.002737909;
                const dayOfYear = getDayOfYear(currentDate);
                const timeAngle = (siderealHours / 24) * 2 * Math.PI;
                const dateAngle = (dayOfYear / 365) * 2 * Math.PI;
                const rotation = -(timeAngle + dateAngle);

                skyCtx.save();
                skyCtx.translate(centerX, centerY);
                skyCtx.rotate(rotation);
                drawConstellation(starData.bigDipper, scale);
                drawConstellation(starData.littleDipper, scale);
                drawConstellation(starData.cassiopeia, scale);
                if (showDetailsCheckbox.checked) drawPointerLine(scale);
                skyCtx.restore();
            }

            function drawConstellation(constellation, scale) {
                const showDetails = showDetailsCheckbox.checked;
                skyCtx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                skyCtx.lineWidth = 1;
                skyCtx.beginPath();
                constellation.lines.forEach(line => {
                    const start = constellation.stars[line[0]];
                    const end = constellation.stars[line[1]];
                    skyCtx.moveTo(start.x * scale, start.y * scale);
                    skyCtx.lineTo(end.x * scale, end.y * scale);
                });
                skyCtx.stroke();
                skyCtx.fillStyle = '#FFFFFF';
                constellation.stars.forEach(star => {
                    skyCtx.beginPath();
                    skyCtx.arc(star.x * scale, star.y * scale, 2, 0, 2 * Math.PI);
                    skyCtx.fill();
                });
                if (showDetails) {
                    skyCtx.fillStyle = 'rgba(255, 255, 255, 0.9)'; // Brighter text
                    skyCtx.font = `bold 12px Arial`;
                    skyCtx.textAlign = 'center';
                    const firstStar = constellation.stars[0];
                    skyCtx.fillText(constellation.name, firstStar.x * scale, firstStar.y * scale - 15);
                }
            }
            
            function drawPointerLine(scale) {
                 const dubhe = starData.bigDipper.stars[4];
                 const polaris = starData.littleDipper.stars[0];
                 skyCtx.beginPath();
                 skyCtx.setLineDash([2, 4]);
                 skyCtx.strokeStyle = 'rgba(255, 230, 0, 1)';
                 skyCtx.lineWidth = 1;
                 skyCtx.moveTo(dubhe.x * scale, dubhe.y * scale);
                 skyCtx.lineTo(polaris.x * scale, polaris.y * scale);
                 skyCtx.stroke();
                 skyCtx.setLineDash([]);
            }

            function drawAnalogClock() {
                const radius = analogClockCanvas.width / 2;
                analogCtx.clearRect(0, 0, 180, 180);
                analogCtx.save();
                analogCtx.translate(radius, radius);
                const clockRadius = radius * 0.9;
                analogCtx.beginPath();
                analogCtx.arc(0, 0, clockRadius, 0, 2 * Math.PI);
                analogCtx.fillStyle = 'white';
                analogCtx.fill();
                analogCtx.strokeStyle = '#333';
                analogCtx.lineWidth = 2;
                analogCtx.stroke();
                analogCtx.font = clockRadius * 0.12 + "px arial";
                analogCtx.textAlign = "center";
                analogCtx.textBaseline = "middle";
                analogCtx.fillStyle = '#333';
                for (let num = 0; num < 24; num++) {
                    const ang = num * Math.PI / 12;
                    analogCtx.rotate(ang);
                    analogCtx.translate(0, -clockRadius * 0.85);
                    analogCtx.rotate(-ang);
                    if (num % 3 === 0) analogCtx.fillText(num.toString(), 0, 0);
                    analogCtx.rotate(ang);
                    analogCtx.translate(0, clockRadius * 0.85);
                    analogCtx.rotate(-ang);
                    const tickLength = (num % 6 === 0) ? clockRadius * 0.1 : clockRadius * 0.05;
                    analogCtx.beginPath();
                    analogCtx.lineWidth = (num % 6 === 0) ? 2 : 1;
                    analogCtx.moveTo(0, -clockRadius);
                    analogCtx.lineTo(0, -clockRadius + tickLength);
                    analogCtx.stroke();
                }
                analogCtx.font = clockRadius * 0.09 + "px arial";
                const labelPos = clockRadius * 0.65;
                analogCtx.fillText("12 am", 0, -labelPos);
                analogCtx.fillText("6 am", labelPos, 0);
                analogCtx.fillText("12 pm", 0, labelPos);
                analogCtx.fillText("6 pm", -labelPos, 0);

                const hour = currentDate.getHours();
                const minute = currentDate.getMinutes();
                const hourAngle = (hour % 24 + minute / 60) * (Math.PI / 12);
                drawHand(hourAngle, clockRadius * 0.5, 6, '#333');
                const minuteAngle = (minute) * (Math.PI / 30);
                drawHand(minuteAngle, clockRadius * 0.75, 4, '#333');
                
                analogCtx.beginPath();
                analogCtx.arc(0, 0, clockRadius * 0.05, 0, 2 * Math.PI);
                analogCtx.fillStyle = '#C2B280';
                analogCtx.fill();
                analogCtx.restore();
            }

            function drawHand(pos, length, width, color) {
                analogCtx.save();
                analogCtx.beginPath();
                analogCtx.lineWidth = width;
                analogCtx.lineCap = "round";
                analogCtx.strokeStyle = color;
                analogCtx.moveTo(0, 0);
                analogCtx.rotate(pos);
                analogCtx.lineTo(0, -length);
                analogCtx.stroke();
                analogCtx.restore();
            }

            // --- UI UPDATE & EVENT HANDLING ---
            function updateUI() {
                timeInput.value = currentDate.toTimeString().substring(0, 5);
                dayInput.value = currentDate.getDate();
                monthSelect.value = currentDate.getMonth();
                monthSlider.value = getDayOfYear(currentDate) - 1;
                latitudeValue.textContent = `${latitude}°`;
                drawSky();
                drawAnalogClock();
            }

            function handleClockDrag(e) {
                if (!isDraggingHour && !isDraggingMinute) return;
                const rect = analogClockCanvas.getBoundingClientRect();
                const x = e.clientX - rect.left - (rect.width / 2);
                const y = e.clientY - rect.top - (rect.height / 2);
                const angle = Math.atan2(y, x) + Math.PI / 2;

                if (isDraggingMinute) {
                    let minutes = (angle * 30 / Math.PI) % 60;
                    minutes = minutes < 0 ? minutes + 60 : minutes;
                    currentDate.setMinutes(Math.round(minutes));
                } else if (isDraggingHour) {
                    let hours = (angle * 12 / Math.PI) % 24;
                    hours = hours < 0 ? hours + 24 : hours;
                    const originalHours = currentDate.getHours();
                    if (originalHours >= 12 && hours < 12) hours += 12;
                    if (originalHours < 12 && hours >= 12) hours -= 12;

                    currentDate.setHours(Math.round(hours));
                }
                updateUI();
            }
            
            function startClockDrag(e) {
                const rect = analogClockCanvas.getBoundingClientRect();
                const radius = rect.width / 2;
                const x = e.clientX - rect.left - radius;
                const y = e.clientY - rect.top - radius;
                const dist = Math.sqrt(x*x + y*y);

                const minuteHandLength = radius * 0.9 * 0.75;
                const hourHandLength = radius * 0.9 * 0.5;

                if (dist < minuteHandLength + 10 && dist > hourHandLength - 10) {
                    isDraggingMinute = true;
                } else if (dist < hourHandLength + 10) {
                    isDraggingHour = true;
                }
                if (isDraggingMinute || isDraggingHour) {
                    stopAllAnimations();
                    window.addEventListener('mousemove', handleClockDrag);
                    window.addEventListener('mouseup', stopClockDrag);
                }
            }

            function stopClockDrag() {
                isDraggingHour = false;
                isDraggingMinute = false;
                window.removeEventListener('mousemove', handleClockDrag);
                window.removeEventListener('mouseup', stopClockDrag);
            }

            function stopAllAnimations() {
                isAnimating = false;
                cancelAnimationFrame(animationFrameId);
                animationBtn.textContent = 'Start Animation';
            }

            function handleManualInputChange() {
                stopAllAnimations();
                const month = parseInt(monthSelect.value, 10);
                const day = parseInt(dayInput.value, 10);
                const daysInMonth = new Date(currentDate.getFullYear(), month + 1, 0).getDate();
                if (day > daysInMonth) dayInput.value = daysInMonth;
                currentDate.setMonth(month, dayInput.value);
                const timeParts = timeInput.value.split(':');
                if (timeParts.length >= 2) {
                    const hours = parseInt(timeParts[0], 10);
                    const minutes = parseInt(timeParts[1], 10);
                    if (!isNaN(hours) && !isNaN(minutes)) currentDate.setHours(hours, minutes);
                }
                updateUI();
            }
            
            function handleSliderChange() {
                stopAllAnimations();
                const dayOfYear = parseInt(monthSlider.value, 10) + 1;
                const newDate = new Date(currentDate.getFullYear(), 0);
                newDate.setDate(dayOfYear);
                currentDate.setMonth(newDate.getMonth());
                currentDate.setDate(newDate.getDate());
                updateUI();
            }
            
            function setToSystemClock() {
                stopAllAnimations();
                currentDate = new Date();
                updateUI();
            }
            
            function resetClock() {
                stopAllAnimations();
                currentDate = new Date(new Date().getFullYear(), 5, 15, 7, 55, 0);
                latitude = 40;
                latitudeSlider.value = 40;
                updateUI();
            }

            function toggleAnimation() {
                isAnimating = !isAnimating;
                if (isAnimating) {
                    animationBtn.textContent = 'Stop Animation';
                    mainLoop();
                } else {
                    stopAllAnimations();
                }
            }
            
            // --- UTILITY & INITIALIZATION ---
            function getDayOfYear(date) {
                const start = new Date(date.getFullYear(), 0, 0);
                const diff = date - start;
                const oneDay = 1000 * 60 * 60 * 24;
                return Math.floor(diff / oneDay);
            }
            
            function resizeCanvases() {
                const skyRect = skyCanvas.parentElement.getBoundingClientRect();
                skyCanvas.width = skyRect.width;
                skyCanvas.height = skyRect.height;
                updateUI();
            }

            function init() {
                timeInput.addEventListener('change', handleManualInputChange);
                dayInput.addEventListener('change', handleManualInputChange);
                monthSelect.addEventListener('change', handleManualInputChange);
                monthSlider.addEventListener('input', handleSliderChange);
                latitudeSlider.addEventListener('input', (e) => {
                    latitude = parseInt(e.target.value, 10);
                    updateUI();
                });
                animationSpeedSlider.addEventListener('input', (e) => {
                    animationSpeed = parseInt(e.target.value, 10);
                });
                showDetailsCheckbox.addEventListener('change', updateUI);
                systemClockBtn.addEventListener('click', setToSystemClock);
                resetBtn.addEventListener('click', resetClock);
                animationBtn.addEventListener('click', toggleAnimation);
                analogClockCanvas.addEventListener('mousedown', startClockDrag);
                window.addEventListener('resize', resizeCanvases);
                resizeCanvases();
                setToSystemClock();
            }

            init();
        });