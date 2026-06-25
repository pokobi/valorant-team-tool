document.addEventListener('DOMContentLoaded', () => {
    const playerEntriesContainer = document.getElementById('playerEntries');
    const addPlayerButton = document.getElementById('addPlayerButton');
    const generateTeamsButton = document.getElementById('generateTeamsButton');
    const attackerPlayersUl = document.getElementById('attackerPlayers');
    const defenderPlayersUl = document.getElementById('defenderPlayers');
    const attackerRankSumSpan = document.getElementById('attackerRankSum');
    const defenderRankSumSpan = document.getElementById('defenderRankSum');
    const mapNameP = document.getElementById('mapName');
    const mapImageImg = document.getElementById('mapImage');
    const copyResultButton = document.getElementById('copyResultButton');
    const resultTextTextarea = document.getElementById('resultText');

    const settingsModal = document.getElementById('settingsModal');
    const openSettingsButton = document.getElementById('openSettingsButton');
    const closeSettingsButton = document.getElementById('closeSettingsButton');
    const rankSettingsContainer = document.getElementById('rankSettingsContainer');
    const addRankButton = document.getElementById('addRankButton');
    const saveRankSettingsButton = document.getElementById('saveRankSettingsButton');
    const mapSelectionContainer = document.getElementById('mapSelectionContainer');
    const saveMapSettingsButton = document.getElementById('saveMapSettingsButton');
    const resetTeamsButton = document.getElementById('resetTeamsButton');
    const resetAllDataButton = document.getElementById('resetAllDataButton');

    const selectAllButton = document.getElementById('selectAllButton');
    const deselectAllButton = document.getElementById('deselectAllButton');

    const confirmModal = document.getElementById('confirmModal');
    const confirmMessage = document.getElementById('confirmMessage');
    const confirmOkButton = document.getElementById('confirmOkButton');
    const confirmCancelButton = document.getElementById('confirmCancelButton');

    let players = [];
    let currentAttackerTeam = [];
    let currentDefenderTeam = [];
    let matchHistory = [];
    let rankTiers = [
        { name: 'A+', value: 5 }, { name: 'A', value: 4 },
        { name: 'B+', value: 3 }, { name: 'B', value: 2 }, { name: 'C', value: 1 }
    ];
    let allMaps = [
        { name: 'バインド', file: 'Loading_Screen_Bind.webp', selected: true },
        { name: 'ヘイブン', file: 'Loading_Screen_Haven.webp', selected: true },
        { name: 'スプリット', file: 'Loading_Screen_Split.webp', selected: true },
        { name: 'アセント', file: 'Loading_Screen_Ascent.webp', selected: true },
        { name: 'アイスボックス', file: 'Loading_Screen_Icebox.webp', selected: true },
        { name: 'ブリーズ', file: 'Loading_Screen_Breeze.webp', selected: true },
        { name: 'フラクチャー', file: 'Loading_Screen_Fracture.webp', selected: true },
        { name: 'パール', file: 'Loading_Screen_Pearl.webp', selected: true },
        { name: 'ロータス', file: 'Loading_Screen_Lotus.webp', selected: true },
        { name: 'サンセット', file: 'Loading_Screen_Sunset.webp', selected: true },
        { name: 'アビス', file: 'Loading_Screen_Abyss.webp', selected: true },
        { name: 'カロード', file: 'Loading_Screen_Corrode.webp', selected: true }
    ];
    let selectedMap = null;

    loadData();
    renderPlayerInputs();
    renderRankSettings();
    renderMapSelection();
    addInitialPlayerEntries();
    setupDragAndDrop();

    addPlayerButton.addEventListener('click', () => {
        addPlayerEntry("", rankTiers[rankTiers.length - 1].name, true); 
        savePlayers();
    });

    generateTeamsButton.addEventListener('click', generateTeamsAndMap);
    openSettingsButton.addEventListener('click', () => settingsModal.style.display = 'block');
    closeSettingsButton.addEventListener('click', () => settingsModal.style.display = 'none');
    window.addEventListener('click', (event) => {
        if (event.target === settingsModal) settingsModal.style.display = 'none';
        if (event.target === confirmModal) confirmModal.style.display = 'none';
    });

    addRankButton.addEventListener('click', addNewRankSettingInput);
    saveRankSettingsButton.addEventListener('click', saveRankSettings);
    saveMapSettingsButton.addEventListener('click', saveMapSettings);
    resetTeamsButton.addEventListener('click', resetTeamDisplay);
    copyResultButton.addEventListener('click', copyResultToClipboard);

    selectAllButton.addEventListener('click', () => toggleAllPlayers(true));
    deselectAllButton.addEventListener('click', () => toggleAllPlayers(false));

    resetAllDataButton.addEventListener('click', () => {
        showConfirm("本当にすべてのデータ・履歴をリセットしますか？この操作は元に戻せません。", resetAllApplicationData);
    });

    function showToast(message, isError = false) {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${isError ? 'error' : ''}`;
        toast.textContent = message;
        container.appendChild(toast);
        
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    let confirmCallback = null;
    function showConfirm(message, callback) {
        confirmMessage.textContent = message;
        confirmModal.style.display = 'block';
        confirmCallback = callback;
    }

    confirmOkButton.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        if (confirmCallback) confirmCallback();
    });

    confirmCancelButton.addEventListener('click', () => {
        confirmModal.style.display = 'none';
        confirmCallback = null;
    });

    function toggleAllPlayers(state) {
        const checkboxes = document.querySelectorAll('.participation-checkbox');
        checkboxes.forEach(cb => cb.checked = state);
        savePlayers();
    }

    function addInitialPlayerEntries() {
        if (players.length === 0) {
            for (let i = 0; i < 5; i++) {
                addPlayerEntry("", rankTiers[rankTiers.length -1].name, true);
            }
        }
    }

    function addPlayerEntry(name = "", rankName = rankTiers[0].name, selected = true, id = null) {
        const entryId = id || String(Date.now() + Math.random());
        const playerEntryDiv = document.createElement('div');
        playerEntryDiv.classList.add('player-entry');
        playerEntryDiv.dataset.id = entryId;

        const participationCheckbox = document.createElement('input');
        participationCheckbox.type = 'checkbox';
        participationCheckbox.checked = selected;
        participationCheckbox.classList.add('participation-checkbox');
        participationCheckbox.addEventListener('change', savePlayers);

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = 'プレイヤー名';
        nameInput.value = name;
        nameInput.addEventListener('change', savePlayers);

        const rankSelect = document.createElement('select');
        rankTiers.forEach(tier => {
            const option = document.createElement('option');
            option.value = tier.name;
            option.textContent = `${tier.name} (${tier.value})`;
            if (tier.name === rankName) option.selected = true;
            rankSelect.appendChild(option);
        });
        rankSelect.addEventListener('change', savePlayers);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = '削除';
        deleteButton.addEventListener('click', () => {
            playerEntriesContainer.removeChild(playerEntryDiv);
            savePlayers();
        });

        playerEntryDiv.appendChild(participationCheckbox);
        playerEntryDiv.appendChild(nameInput);
        playerEntryDiv.appendChild(rankSelect);
        playerEntryDiv.appendChild(deleteButton);
        playerEntriesContainer.appendChild(playerEntryDiv);
    }

    function collectPlayersData() {
        const collectedPlayers = [];
        const entries = playerEntriesContainer.querySelectorAll('.player-entry');
        entries.forEach(entry => {
            const name = entry.querySelector('input[type="text"]').value.trim();
            const rankName = entry.querySelector('select').value;
            const rankValue = rankTiers.find(r => r.name === rankName)?.value || 0;
            const selected = entry.querySelector('.participation-checkbox').checked;
            
            collectedPlayers.push({
                id: entry.dataset.id, 
                name: name,
                rankName: rankName,
                rankValue: rankValue,
                selected: selected
            });
        });
        return collectedPlayers;
    }

    function calculateTeamHistoryPenalty(teamA, teamD) {
        let penalty = 0;
        matchHistory.forEach((record, index) => {
            const weight = 1 / (index + 1);
            penalty += countSharedPairs(teamA, record.attackerTeamIds, record.defenderTeamIds) * weight;
            penalty += countSharedPairs(teamD, record.attackerTeamIds, record.defenderTeamIds) * weight;
        });
        return penalty;
    }

    function countSharedPairs(currentTeam, pastAttackerIds, pastDefenderIds) {
        let count = 0;
        for (let i = 0; i < currentTeam.length; i++) {
            for (let j = i + 1; j < currentTeam.length; j++) {
                const id1 = currentTeam[i].id;
                const id2 = currentTeam[j].id;
                if ((pastAttackerIds.includes(id1) && pastAttackerIds.includes(id2)) ||
                    (pastDefenderIds.includes(id1) && pastDefenderIds.includes(id2))) {
                    count++;
                }
            }
        }
        return count;
    }

    function generateTeamsAndMap() {
        savePlayers();
        const participants = players.filter(p => p.selected && p.name.trim() !== '');

        if (participants.length === 0) {
            showToast('チーム分けに参加するプレイヤーがいません。', true);
            return;
        }
        if (participants.length > 10) {
            showToast(`参加プレイヤーは最大10人までです（現在${participants.length}人）。`, true);
            return;
        }
        if (participants.length < 2) {
             showToast('チーム分けには最低2人必要です。', true);
            return;
        }

        let bestAttackerTeam = [];
        let bestDefenderTeam = [];
        let minDiff = Infinity;
        let minBalance = Infinity;
        let minPenalty = Infinity;

        for (let i = 0; i < 1000; i++) {
            let currentShuffledPlayers = [...participants].sort(() => 0.5 - Math.random());
            let currentAttacker = [];
            let currentDefender = [];
            let sumA = 0;
            let sumD = 0;

            currentShuffledPlayers.forEach(player => {
                if (currentAttacker.length < Math.ceil(currentShuffledPlayers.length / 2) &&
                    (currentAttacker.length <= currentDefender.length || sumA <= sumD)) {
                    if (currentAttacker.length < 5) {
                        currentAttacker.push(player);
                        sumA += player.rankValue;
                    } else if (currentDefender.length < 5) {
                        currentDefender.push(player);
                        sumD += player.rankValue;
                    }
                } else if (currentDefender.length < 5) {
                    currentDefender.push(player);
                    sumD += player.rankValue;
                } else if (currentAttacker.length < 5) {
                    currentAttacker.push(player);
                    sumA += player.rankValue;
                }
            });

            if (currentShuffledPlayers.length <= 9) {
                while (currentAttacker.length > 5 || (currentAttacker.length > currentDefender.length + 1 && currentAttacker.length > Math.ceil(currentShuffledPlayers.length / 2))) {
                    if (currentDefender.length < 5) currentDefender.push(currentAttacker.pop());
                    else break; 
                }
                while (currentDefender.length > 5 || (currentDefender.length > currentAttacker.length + 1 && currentDefender.length > Math.ceil(currentShuffledPlayers.length / 2))) {
                     if (currentAttacker.length < 5) currentAttacker.push(currentDefender.pop());
                     else break;
                }
            }

            const diff = Math.abs(sumA - sumD);
            const currentBalance = Math.abs(currentAttacker.length - currentDefender.length);

            if (currentShuffledPlayers.length === 1) {
                 bestAttackerTeam = currentAttacker; 
                 bestDefenderTeam = currentDefender;
                 break; 
            }

            if (diff < minDiff) {
                minDiff = diff;
                minBalance = currentBalance;
                minPenalty = calculateTeamHistoryPenalty(currentAttacker, currentDefender);
                bestAttackerTeam = [...currentAttacker];
                bestDefenderTeam = [...currentDefender];
            } else if (diff === minDiff) {
                if (currentBalance < minBalance) {
                    minBalance = currentBalance;
                    minPenalty = calculateTeamHistoryPenalty(currentAttacker, currentDefender);
                    bestAttackerTeam = [...currentAttacker];
                    bestDefenderTeam = [...currentDefender];
                } else if (currentBalance === minBalance) {
                    const penalty = calculateTeamHistoryPenalty(currentAttacker, currentDefender);
                    if (penalty < minPenalty) {
                        minPenalty = penalty;
                        bestAttackerTeam = [...currentAttacker];
                        bestDefenderTeam = [...currentDefender];
                    }
                }
            }
        }

        currentAttackerTeam = bestAttackerTeam;
        currentDefenderTeam = bestDefenderTeam;
        selectRandomMap();
        updateTeamDisplay();
        recordMatchHistory(currentAttackerTeam, currentDefenderTeam, selectedMap);
    }

    function setupDragAndDrop() {
        [attackerPlayersUl, defenderPlayersUl].forEach(ul => {
            ul.addEventListener('dragover', e => {
                e.preventDefault();
                ul.classList.add('drag-over');
            });
            ul.addEventListener('dragleave', () => ul.classList.remove('drag-over'));
            ul.addEventListener('drop', e => {
                e.preventDefault();
                ul.classList.remove('drag-over');
                const playerId = e.dataTransfer.getData('text/plain');
                movePlayer(playerId, ul.id);
            });
        });
    }

    function movePlayer(playerId, targetUlId) {
        let playerIndex = currentAttackerTeam.findIndex(p => p.id === playerId);
        let player = null;
        let sourceTeam = null;

        if (playerIndex !== -1) {
            player = currentAttackerTeam[playerIndex];
            sourceTeam = 'attacker';
        } else {
            playerIndex = currentDefenderTeam.findIndex(p => p.id === playerId);
            if (playerIndex !== -1) {
                player = currentDefenderTeam[playerIndex];
                sourceTeam = 'defender';
            }
        }

        if (!player) return;
        if ((sourceTeam === 'attacker' && targetUlId === 'attackerPlayers') || 
            (sourceTeam === 'defender' && targetUlId === 'defenderPlayers')) return;

        if (sourceTeam === 'attacker') {
            currentAttackerTeam.splice(playerIndex, 1);
            currentDefenderTeam.push(player);
        } else {
            currentDefenderTeam.splice(playerIndex, 1);
            currentAttackerTeam.push(player);
        }

        updateTeamDisplay();
        recordMatchHistory(currentAttackerTeam, currentDefenderTeam, selectedMap);
    }

    function updateTeamDisplay() {
        renderTeamList(currentAttackerTeam, attackerPlayersUl);
        renderTeamList(currentDefenderTeam, defenderPlayersUl);
        
        const sumA = currentAttackerTeam.reduce((sum, p) => sum + p.rankValue, 0);
        const sumD = currentDefenderTeam.reduce((sum, p) => sum + p.rankValue, 0);
        
        attackerRankSumSpan.textContent = sumA;
        defenderRankSumSpan.textContent = sumD;

        saveLastTeamAndMap(currentAttackerTeam, currentDefenderTeam, sumA, sumD, selectedMap);
    }

    function renderTeamList(team, ulElement) {
        ulElement.innerHTML = '';
        team.forEach(player => {
            const li = document.createElement('li');
            li.textContent = `${player.name} (ランク: ${player.rankName})`;
            li.draggable = true;
            li.dataset.id = player.id;

            li.addEventListener('dragstart', (e) => {
                li.classList.add('dragging');
                e.dataTransfer.setData('text/plain', player.id);
                e.dataTransfer.effectAllowed = 'move';
            });
            li.addEventListener('dragend', () => li.classList.remove('dragging'));
            ulElement.appendChild(li);
        });
    }

    function selectRandomMap() {
        const availableMaps = allMaps.filter(map => map.selected);
        if (availableMaps.length === 0) {
            mapNameP.textContent = '選択可能なマップがありません';
            mapImageImg.src = '';
            mapImageImg.style.display = 'none';
            selectedMap = null;
            return;
        }

        const mapWeights = availableMaps.map(map => {
            let weight = 1.0;
            matchHistory.forEach((record, index) => {
                if (record.mapName === map.name) {
                    const penaltyFactor = 1 - (1 / (index + 1.5));
                    weight *= Math.max(0.1, penaltyFactor);
                }
            });
            return { map, weight };
        });

        const totalWeight = mapWeights.reduce((sum, item) => sum + item.weight, 0);
        let randomValue = Math.random() * totalWeight;
        
        for (const item of mapWeights) {
            randomValue -= item.weight;
            if (randomValue <= 0) {
                selectedMap = item.map;
                break;
            }
        }
        if (!selectedMap) selectedMap = mapWeights[mapWeights.length - 1].map;

        mapNameP.textContent = selectedMap.name;
        mapImageImg.src = `img/${selectedMap.file}`;
        mapImageImg.alt = selectedMap.name;
        mapImageImg.style.display = 'block';
    }

    function renderPlayerInputs() {
        playerEntriesContainer.innerHTML = '';
        players.forEach(player => {
            const isSelected = player.selected !== undefined ? player.selected : true;
            addPlayerEntry(player.name, player.rankName, isSelected, player.id);
        });
        
        if (players.length < 5 && players.length === 0) { 
             addInitialPlayerEntries();
        } else if (players.length === 0) { 
            addInitialPlayerEntries();
        }
    }

    function renderRankSettings() {
        rankSettingsContainer.innerHTML = '';
        rankTiers.forEach((tier, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('rank-setting-item');

            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.value = tier.name;
            nameInput.placeholder = 'ランク名 (例: A+)';
            itemDiv.appendChild(nameInput);

            const valueInput = document.createElement('input');
            valueInput.type = 'number';
            valueInput.value = tier.value;
            valueInput.placeholder = '強さ';
            itemDiv.appendChild(valueInput);

            const deleteRankButton = document.createElement('button');
            deleteRankButton.textContent = '×';
            deleteRankButton.addEventListener('click', () => {
                rankTiers.splice(index, 1);
                renderRankSettings();
            });
            itemDiv.appendChild(deleteRankButton);

            rankSettingsContainer.appendChild(itemDiv);
        });
        updateAllPlayerRankSelects();
    }

    function addNewRankSettingInput() {
        const itemDiv = document.createElement('div');
        itemDiv.classList.add('rank-setting-item');

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.placeholder = '新しいランク名';
        itemDiv.appendChild(nameInput);

        const valueInput = document.createElement('input');
        valueInput.type = 'number';
        valueInput.placeholder = '強さ';
        itemDiv.appendChild(valueInput);

        const tempDeleteButton = document.createElement('button');
        tempDeleteButton.textContent = '×';
        tempDeleteButton.onclick = () => itemDiv.remove();
        itemDiv.appendChild(tempDeleteButton);

        rankSettingsContainer.appendChild(itemDiv);
    }

    function saveRankSettings() {
        const newRankTiers = [];
        const settingItems = rankSettingsContainer.querySelectorAll('.rank-setting-item');
        let valid = true;
        settingItems.forEach(item => {
            const name = item.querySelector('input[type="text"]').value.trim();
            const value = parseInt(item.querySelector('input[type="number"]').value);
            if (name && !isNaN(value)) {
                newRankTiers.push({ name, value });
            } else {
                valid = false;
            }
        });

        if (!valid || newRankTiers.length === 0) {
            showToast('すべてのランク名と有効な数値を入力してください。', true);
            renderRankSettings(); 
            return;
        }

        rankTiers = newRankTiers;
        rankTiers.sort((a, b) => b.value - a.value); 
        renderRankSettings(); 
        updateAllPlayerRankSelects(); 
        localStorage.setItem('valorantRankTiers', JSON.stringify(rankTiers));
        showToast('ランク設定を保存しました。');
    }

    function updateAllPlayerRankSelects() {
        const allSelects = playerEntriesContainer.querySelectorAll('select');
        allSelects.forEach(select => {
            const currentValue = select.value;
            select.innerHTML = ''; 
            rankTiers.forEach(tier => {
                const option = document.createElement('option');
                option.value = tier.name;
                option.textContent = `${tier.name} (${tier.value})`;
                select.appendChild(option);
            });
            if (rankTiers.some(t => t.name === currentValue)) {
                select.value = currentValue;
            } else if (rankTiers.length > 0) {
                select.value = rankTiers[0].name; 
            }
        });
        savePlayers(); 
    }

    function renderMapSelection() {
        mapSelectionContainer.innerHTML = '';
        allMaps.forEach((map, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('map-select-item');

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `map_checkbox_${index}`;
            checkbox.checked = map.selected;
            checkbox.dataset.mapName = map.name;

            const label = document.createElement('label');
            label.htmlFor = `map_checkbox_${index}`;
            label.textContent = map.name;

            itemDiv.appendChild(checkbox);
            itemDiv.appendChild(label);
            mapSelectionContainer.appendChild(itemDiv);
        });
    }

    function saveMapSettings() {
        const checkboxes = mapSelectionContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const mapName = checkbox.dataset.mapName;
            const mapObj = allMaps.find(m => m.name === mapName);
            if (mapObj) mapObj.selected = checkbox.checked;
        });
        localStorage.setItem('valorantMaps', JSON.stringify(allMaps));
        showToast('マップ設定を保存しました。');
    }

    function resetTeamDisplay() {
        currentAttackerTeam = [];
        currentDefenderTeam = [];
        selectedMap = null;
        updateTeamDisplay();
        mapNameP.textContent = 'マップはまだ選択されていません';
        mapImageImg.src = '';
        mapImageImg.style.display = 'none';
        localStorage.removeItem('lastTeamData');
        showToast('チーム表示とマップをリセットしました。');
    }

    function copyResultToClipboard() {
        if (!selectedMap || (attackerPlayersUl.children.length === 0 && defenderPlayersUl.children.length === 0)) {
            showToast('チーム分けとマップ選択を先に実行してください。', true);
            return;
        }

        const attackerNames = currentAttackerTeam.map(p => p.name);
        const defenderNames = currentDefenderTeam.map(p => p.name);

        const textToCopy = `マップ : ${selectedMap.name} | アタッカー : ${attackerNames.join(', ')} | ディフェンダー : ${defenderNames.join(', ')}`;
        resultTextTextarea.value = textToCopy;
        resultTextTextarea.select();
        try {
            document.execCommand('copy');
            showToast('結果をクリップボードにコピーしました！');
        } catch (err) {
            showToast('コピーに失敗しました。手動でコピーしてください。', true);
        }
        resultTextTextarea.blur();
    }

    function savePlayers() {
        players = collectPlayersData();
        localStorage.setItem('valorantPlayers', JSON.stringify(players));
    }

    function loadPlayers() {
        const storedPlayers = localStorage.getItem('valorantPlayers');
        if (storedPlayers) {
            players = JSON.parse(storedPlayers).map(player => ({
                ...player,
                selected: player.selected !== undefined ? player.selected : true,
                id: player.id || String(Date.now() + Math.random())
            }));
        } else {
            players = [];
        }
    }

    function loadRankTiers() {
        const storedRankTiers = localStorage.getItem('valorantRankTiers');
        if (storedRankTiers) rankTiers = JSON.parse(storedRankTiers);
    }

    function loadMaps() {
        const storedMaps = localStorage.getItem('valorantMaps');
        if (storedMaps) {
            const loadedMaps = JSON.parse(storedMaps);
            allMaps = allMaps.map(defaultMap => {
                const loadedMap = loadedMaps.find(lm => lm.name === defaultMap.name);
                return loadedMap ? { ...defaultMap, selected: loadedMap.selected } : defaultMap;
            });
        }
    }

    function saveLastTeamAndMap(teamA, teamD, sumA, sumD, map) {
        const lastTeamData = {
            attackerTeam: teamA.map(p => ({id: p.id, name: p.name, rankName: p.rankName, rankValue: p.rankValue})),
            defenderTeam: teamD.map(p => ({id: p.id, name: p.name, rankName: p.rankName, rankValue: p.rankValue})),
            attackerRankSum: sumA,
            defenderRankSum: sumD,
            selectedMap: map
        };
        localStorage.setItem('lastTeamData', JSON.stringify(lastTeamData));
    }

    function loadLastTeamAndMap() {
        const lastData = localStorage.getItem('lastTeamData');
        if (lastData) {
            const data = JSON.parse(lastData);
            if (data.attackerTeam && data.defenderTeam && data.selectedMap) {
                currentAttackerTeam = data.attackerTeam.map(p => ({
                    ...p, id: p.id || String(Date.now() + Math.random()), rankValue: p.rankValue || 0
                }));
                currentDefenderTeam = data.defenderTeam.map(p => ({
                    ...p, id: p.id || String(Date.now() + Math.random()), rankValue: p.rankValue || 0
                }));
                selectedMap = data.selectedMap;
                updateTeamDisplay();
                mapNameP.textContent = selectedMap.name;
                mapImageImg.src = `img/${selectedMap.file}`;
                mapImageImg.alt = selectedMap.name;
                mapImageImg.style.display = 'block';
            }
        }
    }

    function recordMatchHistory(teamA, teamD, map) {
        if (!map || teamA.length === 0 || teamD.length === 0) return;
        const record = {
            attackerTeamIds: teamA.map(p => p.id),
            defenderTeamIds: teamD.map(p => p.id),
            mapName: map.name
        };
        matchHistory.unshift(record);
        if (matchHistory.length > 10) matchHistory.pop();
        localStorage.setItem('valorantMatchHistory', JSON.stringify(matchHistory));
    }

    function loadMatchHistory() {
        const storedHistory = localStorage.getItem('valorantMatchHistory');
        if (storedHistory) matchHistory = JSON.parse(storedHistory);
    }

    function loadData() {
        loadRankTiers();
        loadMaps();
        loadPlayers();
        loadMatchHistory();
        renderPlayerInputs(); 
        updateAllPlayerRankSelects(); 
        loadLastTeamAndMap(); 
    }

    function resetAllApplicationData() {
        localStorage.removeItem('valorantPlayers');
        localStorage.removeItem('valorantRankTiers');
        localStorage.removeItem('valorantMaps');
        localStorage.removeItem('lastTeamData');
        localStorage.removeItem('valorantMatchHistory');

        players = [];
        matchHistory = [];
        rankTiers = [
            { name: 'A+', value: 5 }, { name: 'A', value: 4 },
            { name: 'B+', value: 3 }, { name: 'B', value: 2 }, { name: 'C', value: 1 }
        ];
        allMaps.forEach(map => map.selected = true); 

        renderPlayerInputs(); 
        addInitialPlayerEntries(); 
        renderRankSettings();
        renderMapSelection();
        resetTeamDisplay();

        showToast("すべてのデータがリセットされました。");
    }
});