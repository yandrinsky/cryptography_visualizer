let UI = {
    state: {
        curDragEl: undefined,
    },

    selectors: {
        app: document.getElementById("app"),
        inventory: document.querySelector(".app_inventory"),
        buttonsTable: document.querySelector(".app_buttons"),
        usersTable: document.querySelector(".app_users"),
        addUserBtn: document.querySelector("#add_user_btn"),
        getKitBtn: document.querySelector("#get_kit_btn"),
        logBackBtn: document.querySelector("#log_back"),
        logNextBtn: document.querySelector("#log_next"),
        getAlgBtn: document.querySelector("#algorithm"),
        trash: document.querySelector(".app_trash"),
        openCommandsBtn: document.querySelector("#console"),
        closeCommandsBtn: document.querySelector("#close_commands_btn"),
        commandsStartBtn: document.querySelector(".app_commands_btn"),
        commandsField: document.querySelector(".app_commands_field"),
        commandsError: document.querySelector(".app_commands_error"),
        backgroundDark: document.querySelector(".background_dark"),
        playSetWindow: document.querySelector(".app_play_settings"),
        playSetStartBtn: document.querySelector(".app_play_settings_btn"),
        playSetCloseBtn: document.querySelector("#close_play_settings_btn"),
        playSetRadios: document.getElementsByName("play_type"),
        playSetDuration: document.querySelector("#play_by_video_duration"),
        playArrowRight: undefined,
        playArrowLeft: undefined,
        algorithmTabs: document.querySelectorAll(".app_commands_tab"),
        hackError: document.querySelector(".hacking"),
        hackErrorClose: document.querySelector("#close_hacking_btn"),
    },

    renders: {
        inventoryCellsRender(){
            UI.selectors.inventory.innerHTML = "";
            for(let i = 0; i < 35; i++){
                UI.selectors.inventory.insertAdjacentHTML("beforeend", "<div class=\"app_inventory_cell\"></div>");
            }
        },

        usersCellsRender(){
            UI.selectors.usersTable.innerHTML = "";
            for(let i = 0; i < 10; i++){
                UI.selectors.usersTable.insertAdjacentHTML("beforeend", "<div class=\"app_users_cell\"></div>");
            }
        },

        buttonsCellsRender(){

            let buttonsExist = UI.selectors.buttonsTable.children.length + 2
            let height;

            height = document.querySelector("#add_user_btn").getBoundingClientRect().height;
            function onlyPositive(num){
                if(num < 0){
                    return 0;
                } else {
                    return num
                }
            }
            let haveHeight = window.innerHeight - buttonsExist * height
            let needToAdd = Math.floor((haveHeight)  / height)
            console.log(haveHeight, needToAdd);

            for(let i = 0; i < 1 + onlyPositive(needToAdd); i++){
                UI.selectors.buttonsTable.insertAdjacentHTML("beforeend", "<div class=\"app_buttons_cell\"></div>");
            }
        },

        cellsRender(){
            this.inventoryCellsRender();
            this.usersCellsRender();
            this.buttonsCellsRender();
        },

        renderUsers(data, startFilling){
            this.usersCellsRender();
            let activeUserId;
            if(data.activeUser !== undefined){
                activeUserId = data.activeUser.id;
            } else{
                activeUserId = undefined;
            }

            let usersKeys = Object.keys(data.users);

            usersKeys.forEach((key, id) => {
                let userIcon, name;
                if(key == activeUserId){
                    userIcon = `<i class=\"fas fa-user-tie user_icon user_icon_active cell_item\" 
                                data-id="${key}" data-instance="${data.users[key].instance}"></i>`;
                } else{
                    userIcon = `<i class=\"fas fa-user user_icon cell_item\" style=\"color: ${data.users[key].color}\" 
                                data-id="${key}" data-instance="${data.users[key].instance}"></i>`;
                }

                if(data.users[key].name === undefined){
                    name = ""
                } else {
                    name = data.users[key].name;
                }

                let userHtml = ` <div class="app_users_cell__wrapper" draggable="true">
                                        ${userIcon}
                                        <div class="app_users_cell__name">${name}</div>
                                        <input type="text" class="nameScan hide">
                                </div>
                            `

                UI.selectors.usersTable.children[id].innerHTML = userHtml;
                //UI.selectors.usersTable.children[id].dataset.id = key;
                UI.eventListeners.usersListener(UI.selectors.usersTable.children[id].children[0]);

                //Когда мы создаём нового пользователя, он приходит без имени. Ловим такого и запускаем поведение на
                //задание имени
                if(data.users[key].name === undefined){
                    let filed = UI.selectors.usersTable.children[id].children[0].children[2];
                    filed.classList.remove("hide");
                    filed.focus()
                    filed.onblur = ()=>{
                        if(filed.value === ""){
                            filed.focus()
                        }
                    }
                    UI.eventListeners.newUserName(filed);
                }
            })
            //После рендеринга навешиваем на юзеров обработчики событий перетягивания и принятия элементов
            UI.methods.makeUsersDraggable();
        },

        renderBoxes(data, startFilling){
            let boxesKeys = Object.keys(data);
            let count = 0;
            boxesKeys.forEach((box, id) =>{
                let locksHtml = "";
                let boxHtml;
                let boxLocksKeys = Object.keys(data[box].locks)
                boxLocksKeys.forEach(lock => {
                    locksHtml += `<i class="fas fa-lock inventory_item" data-id="${data[box].locks[lock].id}" 
                                style="color: ${data[box].locks[lock].color}" data-instance="${data[box].locks[lock].instance}"></i>`
                })
                locksHtml = ` <div class="cell_box__locks">` + locksHtml + `</div>`;

                boxHtml = `
                    <div class="app_inventory_cell__wrapper" draggable="true">
                        <i class="fas fa-treasure-chest inventory_item" style="color: ${data[box].color}" 
                         data-id="${data[box].id}" data-instance="${data[box].instance}"></i>
                         ${locksHtml}
                    </div>
                `
                UI.selectors.inventory.children[startFilling + id].innerHTML = boxHtml;
                //UI.selectors.inventory.children[startFilling + id].dataset.id = data[box].id;
                count += 1;
            })
            return count;
        },

        renderKeys(data, startFilling){
            let keysKeys = Object.keys(data);
            let count = 0;
            keysKeys.forEach((key, id) =>{
                let keyHtml;
                keyHtml = `
                   <div class="app_inventory_cell__wrapper" draggable="true" >
                        <i class="fas fa-key inventory_item" style="color: ${data[key].color}" 
                        data-id="${data[key].id}" data-instance="${data[key].instance}"></i>
                    </div>
                `
                UI.selectors.inventory.children[startFilling + id].innerHTML = keyHtml;
                //UI.selectors.inventory.children[startFilling + id].dataset.id = data[key].id;
                count += 1;
            })
            return count;
        },

        renderLocks(data, startFilling){
            let locksKeys = Object.keys(data);
            let count = 0;
            locksKeys.forEach((lock, id) =>{
                let lockHtml;
                let innerLockHtml;
                if(data[lock].isOpen){
                    innerLockHtml = `<i class="fas fa-lock-open inventory_item" style="color: ${data[lock].color}"
                                        data-id="${data[lock].id}" data-instance="${data[lock].instance}"></i>`
                } else {
                    innerLockHtml = `<i class="fas fa-lock inventory_item" style="color: ${data[lock].color}" 
                                        data-id="${data[lock].id}" data-instance="${data[lock].instance}"></i>`
                }
                lockHtml = `
                   <div class="app_inventory_cell__wrapper" draggable="true">
                        ${innerLockHtml}
                    </div>
                `
                UI.selectors.inventory.children[startFilling + id].innerHTML = lockHtml;
                //UI.selectors.inventory.children[startFilling + id].dataset.id = data[lock].id;
                count += 1;
            })
            return count;
        },

        renderContents(data, startFilling){
            let contentsKeys = Object.keys(data);
            let count = 0;
            contentsKeys.forEach((content, id) =>{
                let keyHtml;
                keyHtml = `
                   <div class="app_inventory_cell__wrapper" draggable="true">
                        <i class="fas fa-sticky-note inventory_item" style="color: ${data[content].color}" 
                        data-id="${data[content].id}" data-instance="${data[content].instance}"></i>
                    </div>
                `
                UI.selectors.inventory.children[startFilling + id].innerHTML = keyHtml;
               //UI.selectors.inventory.children[startFilling + id].dataset.id = data[content].id;
                count += 1;
            })
            return count;
        },

        renderHackingError(data){
            let wrapper = document.querySelector(".hacking_wrapper");
            wrapper.innerHTML = "";
            wrapper.insertAdjacentHTML("beforeend", `
                    <div class="hacking_user">
                        <i class="fas fa-user user_icon hacking_item" style="color: ${data.userColor}"></i>
                        <div class="hacking_user_name">${data.userName}</div>
                    </div>
            `)
            let hackRes = ``;

            let locks = ``
            data.locks.forEach(el=>{
                locks += `<i class="fas fa-lock inventory_item" style="color: ${el}"></i>`;
            })
            locks = `<div class="hacking_result_items">` + locks + `</div>`;

            let content = ``;
            if(data.isHacked){
                content = `<i class="fas fa-sticky-note inventory_item" style="color: ${data.contentColor}"></i>`;
                content = `<div class="hacking_result_title">Украл</div>` + `<div class="hacking_result_items">` + content + `</div>`;
            }
            hackRes = `
                <div class="hacking_result_title">
                    Взломал
                </div>
                ${locks}
                ${content}
            `
            wrapper.insertAdjacentHTML("beforeend", `
                <div class="hacking_result">
                    <div class="hacking_result_title">
                        Взломал
                    </div>
                    ${locks}
                    ${content}
                </div>
            `)
        },

        renderCopyButtons(){
            let inventoryItems = document.querySelectorAll(".app_inventory_cell__wrapper");
            inventoryItems.forEach(el => {
                el.insertAdjacentHTML("beforeend", `<i class="fal fa-copy copy_btn" data-id="none" data-instance="Copy"></i>`)
            })
        },

        renderInventory(data){ //data - это inventory;
            this.inventoryCellsRender();

            let count = 0;
            count += this.renderBoxes(data.boxes, count);
            count += this.renderKeys(data.keys, count);
            count += this.renderLocks(data.locks, count);
            count += this.renderContents(data.contents, count);
            this.renderCopyButtons();
            UI.methods.makeInvntItemsDraggable();
            UI.methods.setDoubleClicks();
            UI.methods.setCopiesButtons();
        },

        renderPlayArrows(){
            let leftArrow = document.createElement("i");
            let rightArrow = document.createElement("i");
            rightArrow.classList.add("fas", "fa-arrow-alt-right", "play_arrow", "play_arrow__right");
            //rightArrow.classList.add("fas fa-arrow-alt-right play_arrow play_arrow__right");
            leftArrow.classList.add("fas", "fa-arrow-alt-left", "play_arrow", "play_arrow__left");
            UI.selectors.playArrowLeft = leftArrow;
            UI.selectors.playArrowRight = rightArrow;
            UI.selectors.app.insertAdjacentElement("beforeend", leftArrow);
            UI.selectors.app.insertAdjacentElement("beforeend", rightArrow);

            //навешиваем слушатели событий;
            UI.eventListeners.nextStep(rightArrow);
            UI.eventListeners.beforeStep(leftArrow);
        },

        renderStopPlayBtn(){
            UI.selectors.buttonsTable.children[6].id = "stopPlay";
            UI.selectors.buttonsTable.children[6].innerHTML = `<i class="far fa-sign-out cell_item app_buttons_item"></i>`;
            UI.eventListeners.stopPlay(UI.selectors.buttonsTable.children[6]);
        }


    },

    eventFunctions: {
        dragStart(e){
            if(e.target.children[e.target.children.length - 1].classList.contains("copy_btn")){
                e.target.children[e.target.children.length - 1].classList.add("hide");
            }

            //e.target.classList.add("hide");

            setTimeout(()=>{
                e.target.classList.add("hide");
            }, 0)
            UI.state.curDragEl = e.target.children[0];
        },

        dragEnd(e){
            if(e.target.children[e.target.children.length - 1].classList.contains("copy_btn")){
                e.target.children[e.target.children.length - 1].classList.remove("hide");
            }
            e.target.classList.remove("hide")
        },

        dragOver(e){
            e.preventDefault();
        },

        dragDrop(e){
            let eInstance = e.target.children[0].dataset.instance;
            let eId = e.target.children[0].dataset.id;
            let targetInstance = UI.state.curDragEl.dataset.instance;
            let targetId = UI.state.curDragEl.dataset.id;

            if(eInstance === "Lock" && targetInstance === "Key"){
                Dispatcher.dispatch("openLock", {idLock: eId, idKey: targetId});
            }
            if(eInstance === "Box" && targetInstance === "Lock"){
                Dispatcher.dispatch("setLock", {idBox: eId, idLock: targetId});
            }
            if(eInstance === "Box" && targetInstance === "Key"){
                Dispatcher.dispatch("unlock", {idBox: eId, idKey: targetId});
            }
            if(eInstance === "Box" && targetInstance === "Content"){
                Dispatcher.dispatch("pack", {idBox: eId, idPackContent: targetId});
            }
            if(eInstance === "Box" && targetInstance === "Box"){
                Dispatcher.dispatch("pack", {idBox: eId, idPackBox: targetId});
            }
            if(eInstance === "User" && targetInstance === "Box"){
                Dispatcher.dispatch("sendBox", {idBox: targetId, where: Number(eId)});
            }
            if(eInstance === "User" && targetInstance === "Key"){
                Dispatcher.dispatch("shareKey", {idKey: targetId, where: Number(eId)});
            }
            if(eInstance === "User" && targetInstance === "Lock"){
                Dispatcher.dispatch("shareLock", {idLock: targetId, where: Number(eId)});
            }

            if(eInstance === "Trash"){
                if(targetInstance === "Lock"){
                    Dispatcher.dispatch("remove", {idLock: targetId});
                } else if(targetInstance === "Box"){
                    Dispatcher.dispatch("remove", {idBox: targetId});
                } else if(targetInstance === "Key"){
                    Dispatcher.dispatch("remove", {idKey: targetId});
                } else if(targetInstance === "Content"){
                    Dispatcher.dispatch("remove", {idContent: targetId});
                } else if(targetInstance === "User"){
                    Dispatcher.dispatch("remove", {idUser: targetId});
                }
                setTimeout(()=>{
                    UI.selectors.trash.children[0].classList.remove("active");
                }, 200);

            }
        },

        dragEnter(e){
            e.target.children[e.target.children.length - 1].classList.add("active");
        },

        dragLeave(e){
            e.target.children[e.target.children.length - 1].classList.remove("active");
        },

        setActiveUser(e) {
            let id = e.target.children[0].dataset.id;
            Dispatcher.dispatch("setActiveUser", {idUser: id});
        },

        addNewUser(e){
            Dispatcher.dispatch("newUser", {name: undefined});
        },

        newUserEnterName(e){
            let name = e.target.value;
            let id = e.target.previousElementSibling.previousElementSibling.dataset.id;
            Dispatcher.dispatch("updateUsername", {name: name, idUser: id});
        },

        getKit(e){
            let id = e.target.parentNode.dataset.id;
            Dispatcher.dispatch("createKit", {idUser: id});
        },
        logNext(e){
            Dispatcher.dispatch("logNext");
        },
        logBack(e){
            Dispatcher.dispatch("logBack");
        },
        closeLock(e){
            Dispatcher.dispatch("closeLock", {idLock: e.target.children[0].dataset.id});
        },
        openBox(e){
            Dispatcher.dispatch("openBox", {idBox: e.target.children[0].dataset.id});
        },
        copy(e){
            let id;
            let instance;
            for(let i = 0; i < e.target.parentNode.children.length; i++){
                if(e.target.parentNode.children[i].dataset.id && e.target.parentNode.children[i].dataset.id !== "none"){
                    id = e.target.parentNode.children[i].dataset.id
                    instance = e.target.parentNode.children[i].dataset.instance
                }
            }

            Dispatcher.dispatch("copyItem", {id, instance});
        },

        commandsType(e){
            let commands = UI.selectors.commandsField.value;
            Dispatcher.dispatch("commandConsole", {commands});
        },

        openPlaySettings(e){
            UI.selectors.backgroundDark.classList.remove("hide");
            document.body.classList.add("scroll_block");
            UI.selectors.playSetWindow.classList.remove('hide');
        },

        closePlaySettings(e){
            UI.selectors.backgroundDark.classList.add("hide")
            document.body.classList.remove("scroll_block");
            UI.selectors.playSetWindow.classList.add('hide');
        },

        playSettingsPlay(e){
            let type;
            let duration;
            UI.selectors.playSetRadios.forEach(el => {
                if(el.checked){
                    type = el.value;
                }
            })
            if(type === "video"){
                duration = UI.selectors.playSetDuration.value
                if(duration === ""){
                    duration = 1500
                } else {
                    duration = Math.abs(Number(duration));
                }
                if(duration === 0){
                    type = "flash"
                }
            } else if(type === "flash"){
                duration = 0;
            }
            Dispatcher.dispatch("play_algorithm", {type, duration});
            UI.eventFunctions.closePlaySettings();
        },

        openCommands(e){
            UI.selectors.backgroundDark.classList.remove("hide");
            document.body.classList.add("scroll_block");
            UI.selectors.commandsField.parentNode.classList.remove("hide");
            UI.selectors.commandsField.focus();

            UI.selectors.commandsField.onblur = () =>{
                UI.selectors.commandsField.focus();
            }

            UI.eventFunctions.showAlgTabs();
        },

        insertCommands(commands){
            UI.selectors.commandsField.value = commands;
        },

        closeCommands(e){
            UI.selectors.backgroundDark.classList.add("hide");
            document.body.classList.remove("scroll_block");
            UI.selectors.commandsField.parentNode.classList.add("hide");
            //скрываем поле ошибки ошибку
            UI.selectors.commandsError.classList.remove("app_commands_error_show");

            //ставим табы с состояние "свой алгоритм"
            UI.selectors.algorithmTabs.forEach(el => {
                el.classList.remove("app_commands_active");
            })
            UI.selectors.algorithmTabs[0].classList.add("app_commands_active");
            UI.selectors.commandsField.value = "";
            UI.eventFunctions.hideAlgTabs();

        },

        showCommandsError(error){
            UI.selectors.commandsError.innerHTML = "";
            UI.selectors.commandsError.insertAdjacentHTML("beforeend", `<div>${error.description}</div>`);
            UI.selectors.commandsError.insertAdjacentHTML("beforeend", `<div>строка: ${error.line}</div>`);
            UI.selectors.commandsError.classList.add("app_commands_error_show");
        },

        showHelpConsole(e){
            UI.selectors.commandsField.value = `<> - это обозначение переменного значения. Сами кавычки писать не обязательно
            
new user as <user name> - создание пользователя\nset active user <name> - установка активного пользователя\nset lock <lock name> on <box name> - установка замка на бокс\nget kit as <name> - выдача набора (ключ, замок, контент, бокс). Доступ к элементам <name>_box, <name>_key, <name>_lock, <name>_content\nremove <name> - удалить элемент или пользователя\npack <name> in <name box> - упаковать бокс или контент в бокс\nopen <box name> - открыть бокс\nsend <box name> to <user name> - отправить бокс юзеру\nshare <name> with <user name> - поделиться ключом/замком с юзером\\nunlock <box name> with <key name> - открыть шкатулку ключом\ncopy <name> as <new name> - копия всего, кроме юзеров`


        },

        blockApp(){
            if(window.innerWidth < 912){
                document.querySelector(".block_app").classList.remove("hide")
            } else {
                document.querySelector(".block_app").classList.add("hide")
            }
        },

        nextStep(){
            Dispatcher.dispatch("playStep", {move: "next"});
        },

        beforeStep(){
            Dispatcher.dispatch("playStep", {move: "before"});
        },

        stopPlay(){
            Dispatcher.dispatch("stopPlay");
        },

        removePlayArrows(){
            UI.selectors.playArrowLeft.remove();
            UI.selectors.playArrowRight.remove();
        },

        removeStopPlayBtn(){
            UI.selectors.buttonsTable.children[6].id = "";
            UI.selectors.buttonsTable.children[6].innerHTML = "";
        },
        getAlgorithm(){
            Dispatcher.dispatch("getAlgorithm");
        },

        algorithmTabUpdate(e){
            UI.selectors.algorithmTabs.forEach(el => {
                el.classList.remove("app_commands_active");
            })
            e.target.classList.add("app_commands_active");
            let id = e.target.id;
            let field = UI.selectors.commandsField
            if(id === "tab_message"){
                field.value = "new user as Алиса\n" +
                    "new user as Ева\n" +
                    "new user as Боб\n" +
                    "set active user Алиса\n" +
                    "get kit as one\n" +
                    "share one_lock with Боб\n" +
                    "set active user Боб\n" +
                    "get kit as two\n" +
                    "pack two_content in two_box\n" +
                    "set lock one_lock on two_box\n" +
                    "send two_box to Алиса\n" +
                    "set active user Алиса\n" +
                    "unlock two_box with one_key\n" +
                    "open two_box ";
            } else if(id === "tab_sign"){
                field.value = "new user as Алиса\n" +
                    "new user as Пользователь1\n" +
                    "new user as Пользователь2\n" +
                    "new user as Пользователь3\n" +
                    "set active user Алиса\n" +
                    "get kit as one\n" +
                    "remove one_content\n" +
                    "remove one_box\n" +
                    "share one_lock with Пользователь1\n" +
                    "share one_lock with Пользователь2\n" +
                    "share one_lock with Пользователь3\n" +
                    "set active user Пользователь1\n" +
                    "get kit as two\n" +
                    "pack two_content in two_box\n" +
                    "set lock one_lock on two_box\n" +
                    "set lock two_lock on two_box\n" +
                    "send two_box to Алиса\n" +
                    "set active user Алиса\n" +
                    "unlock two_box with one_key\n" +
                    "send two_box to Пользователь1\n" +
                    "set active user Пользователь1\n" +
                    "unlock two_box with two_key\n" +
                    "open two_box"
            } else if(id === "tab_coin"){
                field.value = "new user as Алиса\n" +
                    "new user as Боб\n" +
                    "set active user Алиса\n" +
                    "get kit as one\n" +
                    "copy one_content as two_content\n" +
                    "copy one_box as two_box\n" +
                    "pack one_content in one_box\n" +
                    "pack two_content in two_box\n" +
                    "copy one_lock as four_lock\n" +
                    "set lock one_lock on one_box\n" +
                    "set lock four_lock on two_box\n" +
                    "send one_box to Боб\n" +
                    "send two_box to Боб\n" +
                    "set active user Боб\n" +
                    "get kit as three\n" +
                    "remove three_box\n" +
                    "remove three_content\n" +
                    "set lock three_lock on one_box\n" +
                    "send one_box to Алиса\n" +
                    "set active user Алиса\n" +
                    "unlock one_box with one_key\n" +
                    "send one_box to Боб\n" +
                    "set active user Боб\n" +
                    "unlock one_box with three_key\n" +
                    "open one_box\n" +
                    "share three_key with Алиса\n" +
                    "set active user Алиса\n" +
                    "share one_key with Боб"
            } else if(id === "tab_money"){
                field.value = "new user as Покупатель\n" +
                    "new user as Банк\n" +
                    "new user as Банк_купюр\n" +
                    "new user as Продавец\n" +
                    "new user as Счет_покупателя\n" +
                    "new user as Счет_продавца\n" +
                    "set active user Счет_покупателя\n" +
                    "get kit as money_1\n" +
                    "remove money_1_key\n" +
                    "remove money_1_box\n" +
                    "remove money_1_lock\n" +
                    "set active user Покупатель\n" +
                    "get kit as one\n" +
                    "copy one_content as two_content\n" +
                    "pack one_content in one_box\n" +
                    "set lock one_lock on one_box\n" +
                    "send one_box to Банк\n" +
                    "set active user Счет_покупателя\n" +
                    "remove money_1_content\n" +
                    "set active user Банк\n" +
                    "get kit as three\n" +
                    "remove three_content\n" +
                    "remove three_box\n" +
                    "copy three_lock as four_lock\n" +
                    "set lock three_lock on one_box\n" +
                    "send one_box to Покупатель\n" +
                    "set active user Покупатель\n" +
                    "unlock one_box with one_key\n" +
                    "get kit as five\n" +
                    "remove five_content\n" +
                    "remove five_key\n" +
                    "remove five_lock\n" +
                    "pack two_content in five_box\n" +
                    "set active user Продавец\n" +
                    "get kit as six\n" +
                    "remove six_box\n" +
                    "remove six_content\n" +
                    "share six_lock with Покупатель\n" +
                    "set active user Покупатель\n" +
                    "copy six_lock as seven_lock\n" +
                    "set lock six_lock on one_box\n" +
                    "set lock seven_lock on five_box\n" +
                    "send one_box to Продавец\n" +
                    "send five_box to Продавец\n" +
                    "set active user Продавец\n" +
                    "unlock five_box with six_key\n" +
                    "open five_box\n" +
                    "send one_box to Банк\n" +
                    "set active user Банк\n" +
                    "unlock one_box with three_key\n" +
                    "send one_box to Продавец\n" +
                    "set active user Продавец\n" +
                    "unlock one_box with six_key\n" +
                    "copy one_box as eight_box\n" +
                    "open one_box\n" +
                    "set active user Банк_купюр\n" +
                    "get kit as nine\n" +
                    "remove nine_box\n" +
                    "remove nine_content\n" +
                    "share nine_lock with Продавец\n" +
                    "set active user Продавец\n" +
                    "set lock nine_lock on eight_box\n" +
                    "send eight_box to Банк_купюр\n" +
                    "set active user Банк_купюр\n" +
                    "unlock eight_box with nine_key\n" +
                    "open eight_box\n" +
                    "set active user Счет_продавца\n" +
                    "get kit as money_2\n" +
                    "remove money_2_key\n" +
                    "remove money_2_box\n" +
                    "remove money_2_lock"
            } else if(id === "tab_self"){
                field.value = "";
            }
        },

        showAlgTabs(e){
            UI.selectors.algorithmTabs[0].parentNode.classList.remove("hide");
            UI.selectors.commandsField.parentNode.classList.remove("app_commands_field_with_tabs");
        },

        hideAlgTabs(e){
            UI.selectors.algorithmTabs[0].parentNode.classList.add("hide");
            UI.selectors.commandsField.parentNode.classList.add("app_commands_field_with_tabs");
        },

        showHackError() {
            UI.selectors.hackError.classList.remove("hide");
            UI.selectors.backgroundDark.classList.remove("hide");
        },
        hideHackError(){
            UI.selectors.hackError.classList.add("hide");
            UI.selectors.backgroundDark.classList.add("hide");
        },


    },

    eventListeners: {
        usersListener(target){
            target.addEventListener("click", UI.eventFunctions.setActiveUser);
        },

        removeUserListener(target){
            target.removeEventListener("click", UI.eventFunctions.setActiveUser);
        },

        newUserLister(target){
            target.addEventListener("click", UI.eventFunctions.addNewUser);
        },

        removeNewUserLister(target){
            target.removeEventListener("click", UI.eventFunctions.addNewUser);
        },

        newUserName(target){
            target.addEventListener("change", UI.eventFunctions.newUserEnterName);
        },


        getKit(target){
            target.addEventListener("click", UI.eventFunctions.getKit);
        },

        removeGetKit(target){
            target.removeEventListener("click", UI.eventFunctions.getKit);
        },

        logNext(target) {
            target.addEventListener("click", UI.eventFunctions.logNext);
        },

        removeLogNext(target) {
            target.removeEventListener("click", UI.eventFunctions.logNext);
        },

        logBack(target) {
            target.addEventListener("click", UI.eventFunctions.logBack);
        },

        removeLogBack(target) {
            target.removeEventListener("click", UI.eventFunctions.logBack);
        },

        dragStart(target) {
            target.addEventListener("dragstart", UI.eventFunctions.dragStart);
        },

        removeDragStart(target) {
            target.removeEventListener("dragstart", UI.eventFunctions.dragStart);
        },

        dragEnd(target) {
            target.addEventListener("dragend", UI.eventFunctions.dragEnd);
        },

        removeDragEnd(target) {
            target.removeEventListener("dragend", UI.eventFunctions.dragEnd);
        },

        dragEnter(target) {
            target.addEventListener("dragenter", UI.eventFunctions.dragEnter);
        },

        removeDragEnter(target) {
            target.removeEventListener("dragenter", UI.eventFunctions.dragEnter);
        },

        dragLeave(target) {
            target.addEventListener("dragleave", UI.eventFunctions.dragLeave);
        },

        removeDragLeave(target) {
            target.removeEventListener("dragleave", UI.eventFunctions.dragLeave);
        },

        dragOver(target) {
            target.addEventListener("dragover", UI.eventFunctions.dragOver);
        },

        removeDragOver(target) {
            target.removeEventListener("dragover", UI.eventFunctions.dragOver);
        },


        dragDrop(target) {
            target.addEventListener("drop", UI.eventFunctions.dragDrop);
        },

        removeDragDrop(target) {
            target.removeEventListener("drop", UI.eventFunctions.dragDrop);
        },

        closeLock(target){
            fs(target).doubleClick(UI.eventFunctions.closeLock, 200);
        },

        openBox(target){
            fs(target).doubleClick(UI.eventFunctions.openBox, 200);
        },
        copyListener(target){
            target.addEventListener("click", UI.eventFunctions.copy);
        },
        commandsStart(target){
            target.addEventListener("click", UI.eventFunctions.commandsType);
        },
        openCommands(target){
            target.addEventListener("click", UI.eventFunctions.openCommands);
        },
        closeCommands(target){
            target.addEventListener("click", UI.eventFunctions.closeCommands);
        },
        closePlaySettings(target) {
            target.addEventListener("click", UI.eventFunctions.closePlaySettings);
        },
        playSettingsPlay(target){
            target.addEventListener("click", UI.eventFunctions.playSettingsPlay);
        },
        nextStep(target){
            target.addEventListener("click", UI.eventFunctions.nextStep);
        },
        beforeStep(target){
            target.addEventListener("click", UI.eventFunctions.beforeStep);
        },
        stopPlay(target){
            target.addEventListener("click", UI.eventFunctions.stopPlay);
        },
        getAlgorithm(target){
            target.addEventListener("click", UI.eventFunctions.getAlgorithm);
        },

        algTabs(target){
            target.addEventListener("click", UI.eventFunctions.algorithmTabUpdate);
        },

        closeHackError(target){
            target.addEventListener("click", UI.eventFunctions.hideHackError);
        }



    },

    effects: {
        touch: {
            _addTouch(el){
                el.classList.add("touch");
                setTimeout(()=>{
                    el.classList.remove("touch");
                }, 600);
            },

            newUser(){
                this._addTouch(UI.selectors.addUserBtn);
            },
            getKit(){
                this._addTouch(UI.selectors.getKitBtn);
            },
            logBack(){
                this._addTouch(UI.selectors.logBackBtn);
            },
            logNext(){
                this._addTouch(UI.selectors.logNextBtn);
            },
            console(){
                this._addTouch(UI.selectors.openCommandsBtn);
            }
        },
        drop: {
            _createEL(type, color, where){
                let el = document.createElement("i");
                el.classList.add("fas");
                el.classList.add("effect_drop_el");
                el.style.color = color;
                if(type === "Lock"){
                    el.classList.add("fa-lock");
                } else if(type === "Key"){
                    el.classList.add("fa-key");
                } else if(type === "Box"){
                    el.classList.add("fa-treasure-chest");
                } else if(type === "User"){
                    el.classList.add("fa-user");
                } else if(type === "Content"){
                    el.classList.add("fa-sticky-note");
                }
                where.insertAdjacentElement("beforeend", el);
                return el;
            },

            _startAnimationDrop(el, place, duration){
                if(place.classList.contains("app_trash")){
                    el.style.animation = `effect_drop_anim_trash ${duration / 1000}s ease`;
                } else {
                    el.style.animation = `effect_drop_anim ${duration / 1000}s ease`;
                }

                setTimeout(()=>{
                    el.remove();
                }, duration - 30);
                setTimeout(()=>{
                    place.classList.add("touch");
                }, 100);
                setTimeout(()=>{
                    place.classList.remove("touch");
                }, duration - 100);
            },

            toTrash(type, color, duration){
                let el = this._createEL(type, color, UI.selectors.trash);

                el.style.fontSize = "2rem";

                this._startAnimationDrop(el, UI.selectors.trash, duration)
            },

            toBox(id, type, color, duration){
                let boxes = document.querySelectorAll(".fa-treasure-chest");
                let box;
                boxes.forEach(el => {
                    if(el.dataset.id == id){
                        box = el;
                    }
                })
                let el = this._createEL(type, color, box);
                this._startAnimationDrop(el, box, duration);
            },

            toUser(id, type, color, duration){
                let users = document.querySelectorAll(".user_icon");
                let user;
                users.forEach(el => {
                    if(el.dataset.id == id){
                        user = el;
                    }
                })
                let el = this._createEL(type, color, user);
                this._startAnimationDrop(el, user, duration);
            },

            toLock(id, type, color){
                let locks = document.querySelectorAll(".user_icon");
                let lock;
                locks.forEach(el => {
                    if(el.dataset.id == id){
                        lock = el;
                    }
                })
                let el = this._createEL(type, color, lock);
                this._startAnimationDrop(el, lock,1000);
            },


        }

    },

    methods: {
        start() {
            UI.renders.cellsRender();
            //Кнопка нового юзера
            UI.eventListeners.newUserLister(UI.selectors.addUserBtn);
            //Кнопка выдача набора
            UI.eventListeners.getKit(UI.selectors.getKitBtn);
            //Кнопка лог вперед
            UI.eventListeners.logNext(UI.selectors.logNextBtn);
            //Кнопка лог назад
            UI.eventListeners.logBack(UI.selectors.logBackBtn);

            //Кнопка мусора
            UI.eventListeners.dragOver(UI.selectors.trash);
            UI.eventListeners.dragDrop(UI.selectors.trash);
            UI.eventListeners.dragEnter(UI.selectors.trash);
            UI.eventListeners.dragLeave(UI.selectors.trash);

            //Кнопка открытия командной оболочки
            UI.eventListeners.openCommands(UI.selectors.openCommandsBtn);
            //Кнопка закрытия коммандной оболочки
            UI.eventListeners.closeCommands(UI.selectors.closeCommandsBtn);
            //Кнопка отправки комманд
            UI.eventListeners.commandsStart(UI.selectors.commandsStartBtn);

            //Табы в консоли
            UI.selectors.algorithmTabs.forEach(el =>{
                UI.eventListeners.algTabs(el);
            })

            //кнопка закрытия окна настроект воспроизведения
            UI.eventListeners.closePlaySettings(UI.selectors.playSetCloseBtn);
            //кнопка начала воспроизведения
            UI.eventListeners.playSettingsPlay(UI.selectors.playSetStartBtn);

            //кнопка получения алгоритма
            UI.eventListeners.getAlgorithm(UI.selectors.getAlgBtn);

            //Кнопка закрытия окна взлома
            UI.eventListeners.closeHackError(UI.selectors.hackErrorClose);
        },

        makeUsersDraggable(){
            //Задём юзерам поведение: и принимать элементы и быть перетянутыми
            let users = document.querySelectorAll(".user_icon");
            users.forEach(el =>{
                UI.eventListeners.dragOver(el.parentNode);
                UI.eventListeners.dragDrop(el.parentNode);
                UI.eventListeners.dragStart(el.parentNode)
                UI.eventListeners.dragEnd(el.parentNode)
            })
        },

        makeInvntItemsDraggable(){
            let items = document.querySelectorAll(".inventory_item");
            items.forEach(item => {
                UI.eventListeners.dragStart(item.parentNode);
                UI.eventListeners.dragEnd(item.parentNode);
            })

            let boxes = document.querySelectorAll(".fa-treasure-chest");
            let locks = document.querySelectorAll(".fa-lock");

            boxes.forEach(el => {
                UI.eventListeners.dragOver(el.parentNode);
                UI.eventListeners.dragDrop(el.parentNode);
            })

            locks.forEach(el => {
                UI.eventListeners.dragOver(el.parentNode);
                UI.eventListeners.dragDrop(el.parentNode);
            })

        },

        setDoubleClicks(){
            let locks = document.querySelectorAll(".fa-lock-open");
            let boxes = document.querySelectorAll(".fa-treasure-chest");
            locks.forEach(el =>{
                UI.eventListeners.closeLock(el.parentNode);
            })
            boxes.forEach(el => {
                UI.eventListeners.openBox(el.parentNode);
            })
        },

        setCopiesButtons(){
            let btn = document.querySelectorAll(".copy_btn");
            btn.forEach(el =>{
                UI.eventListeners.copyListener(el);
            })
        },

        openCommandsConsole(){
            UI.eventFunctions.openCommands();
        },

        hideAlgTabs(){
            UI.eventFunctions.hideAlgTabs();
        },


        insertCommandsIntoConsole(commands){
            UI.eventFunctions.insertCommands(commands);
        },

        closeCommandConsole(){
            UI.eventFunctions.closeCommands();
        },

        showCommandsError(error) {
            UI.eventFunctions.showCommandsError(error);
        },

        showHelpConsole(){
            UI.eventFunctions.showHelpConsole();
        },

        openPlaySettings() {
            UI.eventFunctions.openPlaySettings();
        },

        removePlayArrows(){
            UI.eventFunctions.removePlayArrows();
        },

        removeStopPlayBtn(){
            UI.eventFunctions.removeStopPlayBtn();
        },

        viewMode(){
            document.querySelectorAll(".app_inventory_cell__wrapper").forEach(el =>{
                el.classList.add("unavailable");
            })
            document.querySelectorAll(".app_users_cell__wrapper").forEach(el =>{
                el.classList.add("unavailable");
            })
            document.querySelectorAll(".app_buttons_cell").forEach(el =>{
                if(el.id !== "stopPlay"){
                    el.classList.add("unavailable_btn");
                }
            })
            document.querySelector(".app_trash").classList.add("unavailable_btn");
        },

        sandBoxMode(){
            document.querySelectorAll(".app_inventory_cell__wrapper").forEach(el =>{
                el.classList.remove("unavailable");
            })
            document.querySelectorAll(".app_users_cell__wrapper").forEach(el =>{
                el.classList.remove("unavailable");
            })
            document.querySelectorAll(".app_buttons_cell").forEach(el =>{
                el.classList.remove("unavailable_btn");
            })
            document.querySelector(".app_trash").classList.remove("unavailable_btn");
        },

        showHackError(data){
            UI.eventFunctions.showHackError();
            UI.renders.renderHackingError(data);
        },
        closeHackError(){
            UI.eventFunctions.hideHackError();
        },
        dark(){
            UI.selectors.backgroundDark.classList.remove("hide");
        }

    },
}

window.onresize = UI.eventFunctions.blockApp;
window.onload = UI.eventFunctions.blockApp;


