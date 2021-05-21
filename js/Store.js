let Store = {

    state: {
        users: {},
        activeUser: undefined,
        logs: [],
        currentLog: -1,
        algorithm: [],
        currentAlgStep: -1,
        ignoredTypes: ["getUsersData", "logBack", "logNext", "isActiveUser", "getItemData", "getAlgorithm", "firstLog"],
    },

    dispatch(type, props) {
        let methods = {
            createKit(){
                let activeUser = Store.state.activeUser;
                if(activeUser !== undefined){
                    let box = Store._local.classes.Box();
                    let lock = Store._local.classes.Lock();
                    let key = Store._local.classes.Key(lock.key, lock.color);
                    let content = Store._local.classes.Content("some secret info");
                    activeUser.addBox(box)
                    activeUser.addKey(key)
                    activeUser.addLock(lock)
                    activeUser.addContent(content)
                    return {
                        [box.instance]: {id: box.id, instance: box.instance},
                        [lock.instance]: {id: lock.id, instance: lock.instance},
                        [key.instance]: {id: key.id, instance: key.instance},
                        [content.instance]: {id: content.id, instance: content.instance},
                    };
                } else {
                    return false;
                }

            },

            newUser(name){
                if(Object.keys(Store.state.users).length < 10){
                    let user = Store._local.classes.User(name);
                    Store.state.users[user.id] = user;
                    return {id: user.id, instance: "User"};
                } else{
                    return false;
                }
            },

            updateUsername(name, userId){
                Store.state.users[userId].name = name;
                return true;
            },

            setActiveUser(id){
                Store.state.activeUser = Store.state.users[id];
                return true;
            },

            pack(idBox, idPackCont, idPackBox){
                let activeUser = Store.state.activeUser;
                let res = false;
                //Проверяем, не занят ли уже бокс
                if (activeUser.inventory.boxes[idBox].content === undefined){
                    //Мы можем упаковать и контент и коробку в коробку. В функцию передавать будет всегда 2 id, но 1 из них
                    //будет undefined. Выбираем существуюший
                    if(idPackCont !== undefined){
                        res = activeUser.inventory.boxes[idBox].setContent(activeUser.inventory.contents[idPackCont]);
                        if(res === true){
                            activeUser.removeContent(idPackCont);
                        }
                    } else if(idPackBox !== undefined){
                        res = activeUser.inventory.boxes[idBox].setContent(activeUser.inventory.boxes[idPackBox]);
                        if(res === true){
                            activeUser.removeBox(idPackBox);
                        }
                    }
                }

                return res;
            },

            //Открытие коробки. Для функции hacking добавлен idUser. Потому что теперь коробку пытается открыть
            //взломщик, а не активный юзер
            openBox(idBox, idUser){
                let activeUser = Store.state.activeUser;

                let res = activeUser.inventory.boxes[idBox].getContent();
                //Если хоть 1 замок закрыт, то открыть не получится, вернётся false
                if(res !== false){
                    activeUser.removeBox(idBox);
                    //Проверка, на случай того, если в коробке не было ничего
                    if(res !== undefined){
                        //проверка из-за случая, если коробочку пытается открыть взломщик, т.е. данные уходят ему
                        if(idUser){
                           activeUser = Store.state.users[idUser];
                        }
                        if(res.instance === "Box"){
                            activeUser.addBox(res);
                        } else if(res.instance === "Content"){
                            activeUser.addContent(res);
                        }
                    } else {
                        //Если контента не было. Но коробка открылась, поэтому вернём true;
                        res = true;
                    }
                }

                return res;
            },

            setLock(idBox, idLock){
                let activeUser = Store.state.activeUser;
                activeUser.inventory.boxes[idBox].addLock(activeUser.inventory.locks[idLock]);
                this.lock(idBox, idLock);
                activeUser.removeLock(idLock);
                return true;
            },

            lock(idBox, idLock){
                let activeUser = Store.state.activeUser;
                activeUser.inventory.locks[idLock].lock();
                return true;
            },

            unlock(idBox, idKey, key){
                let activeUser = Store.state.activeUser;
                let res;
                if(idKey){
                    res = activeUser.inventory.boxes[idBox].unlock(activeUser.inventory.keys[idKey].getKey());
                } else if(key){
                    res = activeUser.inventory.boxes[idBox].unlock(key);
                }

                if(res){
                    this.removeLock(idBox, idKey, key);
                }
                return res;
            },

            openLock(idLock, idKey){
                let activeUser = Store.state.activeUser;
                return activeUser.inventory.locks[idLock].unlock(activeUser.inventory.keys[idKey].key);
            },

            closeLock(idLock){
                let activeUser = Store.state.activeUser;
                return activeUser.inventory.locks[idLock].lock();
            },

            removeLock(idBox, idKey, key){
                let activeUser = Store.state.activeUser;
                let res;
                if(idKey){
                    res = activeUser.inventory.boxes[idBox].removeLock(activeUser.inventory.keys[idKey].getKey());
                } else if(key){
                    res = activeUser.inventory.boxes[idBox].removeLock(key);
                }

                //Если передаётся idKey, значи снимет activeUser, а не взломщик. Взломщику замки не нужны, только инфа
                if(res !== false && idKey){
                    activeUser.addLock(res);
                    res = true
                }
                return res
            },

            hacking(idBox, where){ //where - [] кому отправили бокс (id) (send только для 1 человека). Этот юзер не будет участвовать во взломе бокса
                let isHack = false;
                let idHacker = undefined;
                let idContent = undefined;
                let usersKeys = Object.keys(Store.state.users);
                let openedLocks = [];
                //Проходим всех юзеров
                for(let i = 0; i < usersKeys.length && !isHack; i++){
                    let idUser = usersKeys[i]
                    //исключаем активного юзера и тому, кому пересывалется бокс. Сотальные - взломщики
                    if(Store.state.users[idUser].id !== where[0] && Store.state.users[idUser].id !== Store.state.activeUser.id){
                        let keys = Store.state.users[idUser].inventory.keys;
                        let objectKeys = Object.keys(keys);
                        //идём по всем ключам данного юзера
                        for(let j = 0; j < objectKeys.length && !isHack; j++){
                            let idKey = objectKeys[j];

                            //замки могут быть копиями и 1 ключ может снять хоть 100 замков
                            while (true){
                                //если удаётся данным ключом открыть как-то замок на боксе, заносим id замка
                                if(this.unlock(idBox, undefined, keys[idKey].getKey())){
                                    idHacker = idUser;
                                    openedLocks.push(idKey);
                                } else {
                                    break
                                }
                            }

                            //если удаётся открыть бокс, т.е. все замки открыты - останавливаем весь процесс взлома
                            let openRes = this.openBox(idBox, idUser)
                            if(openRes){
                                isHack = true;
                                idContent = openRes.id;
                            }
                        }
                        //Проверяем случай, если ключей ни у кого нет, но и бокс закрыт не был.
                        if(isHack === false){
                            let openRes = this.openBox(idBox, idUser)
                            if(openRes){
                                isHack = true;
                                idHacker = idUser;
                                idContent = openRes.id;
                            }
                        }


                    }
                }

                return {isHacked: isHack, idHacker, openedLocks, idContent}

            },

            sendBox(idBox, where){
                let activeUser = Store.state.activeUser;
                let box = activeUser.inventory.boxes[idBox];
                let hackRes = this.hacking(idBox, where);
                if(!hackRes.isHacked){
                    where.forEach(user =>{
                        Store.state.users[user].addBox(box);
                    })
                    activeUser.removeBox(box.id);
                }
               return hackRes;

            },

            shareKey(idKey, where){
                let activeUser = Store.state.activeUser;
                let key = activeUser.inventory.keys[idKey];
                //раньше мы отдавали ключ только тому, кому посылали
                /*where.forEach(user =>{
                    Store.state.users[user].addKey(Store._local.methods.copy(key));
                })*/
                //Теперь отдаём всем
                Object.keys(Store.state.users).forEach(user => {
                    if(Store.state.users[user].id !== Store.state.activeUser.id){
                        Store.state.users[user].addKey(Store._local.methods.copy(key))
                    }
                })
            },

            shareLock(idLock, where){
                let activeUser = Store.state.activeUser;
                let lock = activeUser.inventory.locks[idLock];
                where.forEach(user =>{
                    Store.state.users[user].addLock(Store._local.methods.copy(lock));
                })
            },

            remove(idLock, idKey, idBox, idContent, idUser){
                let res;
                if(idLock){
                    res = Store.state.activeUser.removeLock(idLock);
                } else if(idKey){
                    res = Store.state.activeUser.removeKey(idKey);
                } else if(idBox){
                    res = Store.state.activeUser.removeBox(idBox);
                } else if(idContent){
                    res = Store.state.activeUser.removeContent(idContent);
                } else if(idUser){
                    res = delete Store.state.users[idUser];
                    //Проверка на то, что activeUser существует и его id равно полученному id
                    if(Store.state.activeUser && (Store.state.activeUser.id === Number(idUser))){
                        Store.state.activeUser = undefined;
                    }

                }
                return res;
            },

            copyItem(id, instance){
                let newId = Store._local.methods.getNewId();
                let inventory = Store.state.activeUser.inventory;
                if(instance === "Box"){
                    inventory.boxes[newId] = Store._local.methods.copy(inventory.boxes[id]);
                    inventory.boxes[newId].id = newId;
                } else if(instance === "Lock"){
                    inventory.locks[newId] = Store._local.methods.copy(inventory.locks[id]);
                    inventory.locks[newId].id = newId;
                } else if(instance === "Key"){
                    inventory.keys[newId] = Store._local.methods.copy(inventory.keys[id]);
                    inventory.keys[newId].id = newId;
                } else if(instance === "Content"){
                    inventory.contents[newId] = Store._local.methods.copy(inventory.contents[id]);
                    inventory.contents[newId].id = newId;
                } else {
                    return false;
                }
                return {id: newId, instance};
            },

            isActiveUser(){
                return (Store.state.activeUser !== undefined);
            },

            newGame(){
                Store.state.activeUser = undefined;
                Store.state.users =  {};
                Store.state.logs = [];
                Store.state.currentLog = -1;
                Store.state.algorithm = [];
                Store._local.methods.getNewId = (function(){
                    let id = 0;
                    function increaseId(){
                        return ++id;
                    }
                    return increaseId;
                })()

                Store._local.methods.getNewColor = (function(){
                    let colors = ["DarkGoldenRod", "DarkGray", "DarkGreen", "DarkKhaki", "DarkMagenta", "MistyRose",
                        "Moccasin", "DarkOliveGreen",  "Aqua", "Aquamarine",  "MediumSlateBlue", "MediumSpringGreen",
                        "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "Bisque", "Black", "BlanchedAlmond", "Blue",
                        "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral",
                        "CornflowerBlue", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkOrange", "DarkOrchid",
                        "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey",
                        "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue",
                        "FireBrick", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray",
                        "Green", "GreenYellow", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender",
                        "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan",
                        "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon",
                        "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSteelBlue", "LightYellow", "Lime",
                        "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid",
                        "MediumPurple", "MediumSeaGreen",  "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab",
                        "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed",
                        "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "RebeccaPurple",
                        "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell",
                        "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen",
                        "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White",
                        "WhiteSmoke", "Yellow", "YellowGreen"]
                    let id = -1;
                    function increaseColor(){
                        ++id;
                        if(id >= colors.length){
                            id = 0;
                        }
                        return colors[id];
                    }
                    return increaseColor;
                })()
                methods._logger();
                return true;
            },

            getItemData(id){
                let res = {};
                let item;
                Object.keys(Store.state.users).forEach(userId =>{
                    let user = Store.state.users[userId];
                    Object.keys(user.inventory).forEach(classItems => {
                        Object.keys(user.inventory[classItems]).forEach(el => {
                            if(user.inventory[classItems][el].id == id){
                                item = user.inventory[classItems][el];
                            }
                        })
                    })
                })

                //если такой предмет не найден, то ищем среди самих пользователей
                if(item === undefined){
                    Object.keys(Store.state.users).forEach(user => {
                        if(Store.state.users[user].id == id){
                            item = Store.state.users[user];
                        }
                    })
                }
                res.color = item.color;
                res.instance = item.instance;
                res.id = item.id;
                res.name = item.name;
                return res
            },

            getUsersData(){
                let res = {};
                if(Store.state.currentLog !== -1 && Store.state.logs[Store.state.currentLog].users !== undefined){
                    res.users = Store.state.logs[Store.state.currentLog].users;
                    res.activeUser = Store.state.logs[Store.state.currentLog].activeUser;
                } else{
                    res.users = undefined;
                    res.activeUser = undefined;
                }
                return res;
            },

            _preprocessingProps(props){
                if(props !== undefined){
                    if(props.where !== undefined){
                        if(props.where === "all"){
                            let where = [];
                            let usersKeys = Object.keys(Store.state.users);
                            usersKeys.forEach(key => {
                                if(key !== Store.state.activeUser.id){
                                    where.push(key);
                                }
                            })
                            props.where = where;
                        } else if(typeof(props.where) === "number"){
                            props.where = [props.where]
                        }
                    }
                }

                return props
            },

            _formResponse(result){
                let response = {};
                if(result !== false){
                    response.success = true;
                    if(typeof(result) === "object"){
                        response.data = result;
                    }
                } else{
                    response.success = false;
                    response.data = undefined;
                }
                return response;
            },

            _logger(){
                Store._local.methods.logger();
                return true;
            }
        }

        props = methods._preprocessingProps(props);
        let res;

        Store._local.methods.changesController(type);

        switch (type){
            case "newUser":
                res = methods.newUser(props.name);
                break;
            case "updateUsername":
                res = methods.updateUsername(props.name, props.idUser);
                break;
            case "setActiveUser":
                res = methods.setActiveUser(props.idUser);
                break;
            case "createKit":
                res = methods.createKit();
                break;
            case "sendBox":
                res = methods.sendBox(props.idBox, props.where);
                break;
            case "shareKey":
                res = methods.shareKey(props.idKey, props.where);
                break;
            case "shareLock":
                res = methods.shareLock(props.idLock, props.where);
                break;
            case "pack":
                res = methods.pack(props.idBox, props.idPackContent, props.idPackBox);
                break;
            case "setLock":
                res = methods.setLock(props.idBox, props.idLock);
                break;
            case "lock":
                res = methods.lock(props.idBox, props.idLock);
                break;
            case "unlock":
                res = methods.unlock(props.idBox, props.idKey);
                break;
            case "openLock":
                res = methods.openLock(props.idLock, props.idKey);
                break;
            case "closeLock":
                res = methods.closeLock(props.idLock);
                break;
            case "removeLock":
                res = methods.removeLock(props.idBox, props.idKey);
                break;
            case "openBox":
                res = methods.openBox(props.idBox);
                break;
            case "logBack":
                res = Store._local.methods.logBack();
                break
            case "logNext":
                res = Store._local.methods.logNext();
                break
            case "remove":
                res = methods.remove(props.idLock, props.idKey, props.idBox, props.idContent, props.idUser);
                break
            case "firstLog":
                res = methods._logger();
                break
            case "getUsersData":
                res = methods.getUsersData()
                break
            case "getItemData":
                res = methods.getItemData(props.id);
                break
            case "copyItem":
                res = methods.copyItem(props.id, props.instance);
                break
            case "isActiveUser":
                res = methods.isActiveUser();
                break
            case "newGame":
                res = methods.newGame();
                break
            case "getAlgorithm":
                res = Store.state.algorithm;
                break
        }

        if(!Store.state.ignoredTypes.includes(type)){
            Store._local.methods.logger();
            Store._local.methods.algorithm(type, props);
        }

        // if(type !== "getUsersData" && type.slice(0, 3) !== "log" && type !== "firstLog" && type !== "isActiveUser" && type !== "getItemData"){
        //
        // }

        return methods._formResponse(res);
    },
    
    _local: {
        classes:{
            showInfo(color, id, instance){
                //console.log("createNewColor. Color is", color, "id is", id, "instance is", instance);
            },
            User(name, id = undefined, color = undefined){
                class User{
                    constructor(name, id, color) {
                        this.inventory = {
                            locks: {},
                            keys: {},
                            boxes: {},
                            contents: {},
                        }
                        this.name = name;
                        this.instance = "User";

                        if(id){
                            this.id = Number(id);
                        } else {
                            this.id = Store._local.methods.getNewId();
                        }
                        if(color){
                            this.color = color;
                        } else {
                            Store._local.classes.showInfo(color, id, this.instance)
                            this.color = Store._local.methods.getNewColor();
                        }


                    }
                    addContent(content){
                        this.inventory.contents[content.id] = content;
                    }

                    addBox(box){
                        this.inventory.boxes[box.id] = box;
                    }

                    addKey(key){
                        this.inventory.keys[key.id] = key;
                    }

                    addLock(lock){
                        this.inventory.locks[lock.id] = lock;
                    }

                    removeContent(id){
                        return delete this.inventory.contents[id];
                    }

                    removeBox(id){
                        return delete this.inventory.boxes[id];
                    }

                    removeKey(id){
                        return delete this.inventory.keys[id];
                    }

                    removeLock(id){
                        return delete this.inventory.locks[id];
                    }

                    updateContent(id, innerContent){
                        this.inventory.contents[id].content = innerContent;
                    }
                }
                return new User(name, id, color);
            },

            Box(id = undefined, color = undefined){
                class Box{
                    constructor(id, color) {
                        this.locks = {};
                        this.content = undefined;
                        this.instance = "Box";

                        if(id){
                            this.id = Number(id);
                        } else {
                            this.id = Store._local.methods.getNewId();
                        }
                        if(color){
                            this.color = color;
                        } else {
                            Store._local.classes.showInfo(color, id, this.instance)
                            this.color = Store._local.methods.getNewColor();
                        }
                    }

                    addLock(lock){
                        this.locks[lock.id] = lock;
                    }

                    removeLock(key){
                        let lockKeys = Object.keys(this.locks);
                        let isFinish = false;
                        let i
                        for(i = 0; i  < lockKeys.length && isFinish !== true; i++){
                            isFinish = this.locks[lockKeys[i]].unlock(key);
                        }
                        if(isFinish){
                            isFinish = this.locks[lockKeys[--i]]
                            delete this.locks[lockKeys[i]]
                        }
                        return isFinish;
                    }

                    unlock(key){
                        let lockKeys = Object.keys(this.locks);
                        let isFinish = false;
                        for(let i = 0; i  < lockKeys.length && isFinish !== true; i++){
                            isFinish = this.locks[lockKeys[i]].unlock(key);
                        }
                        return isFinish;
                    }

                    isOpen(){
                        let lockKeys = Object.keys(this.locks);
                        let isFinish = true;
                        for(let i = 0; i  < lockKeys.length && isFinish !== false; i++){
                            isFinish = this.locks[lockKeys[i]].isOpen;
                        }
                        return isFinish;
                    }

                    setContent(content){
                        let isOpen = this.isOpen()
                        if(isOpen){
                            this.content = content;
                        }
                        return isOpen;
                    }

                    getContent(){
                        if(this.isOpen()){
                            return this.content;
                        } else{
                            return false;
                        }
                    }
                }
                return new Box(id, color);
            },

            Lock(id = undefined, color = undefined){
                class Lock{
                    constructor(id, color) {
                        this.isOpen = true;
                        this.instance = "Lock";
  
                        if(id){
                            this.id = Number(id);
                        } else {
                            this.id = Store._local.methods.getNewId();
                        }

                        if(color){
                            this.color = color;
                        } else {
                            Store._local.classes.showInfo(color, id, this.instance)
                            this.color = Store._local.methods.getNewColor();
                        }
                        this.key = this.id;
                    }

                    lock(){
                        this.isOpen = false;
                    }

                    unlock(key){
                        if(this.key === key) {
                            this.isOpen = true
                        }
                        return this.key === key;
                    }

                    getKey(){
                        return this.key;
                    }
                }
                return new Lock(id, color);
            },

            Key(key, color, id = undefined){
                class Key{
                    constructor(key, color) {
                        this.key = key;
                        this.color = color;
                        this.instance = "Key";

                        if(id){
                            this.id = Number(id);
                        } else {
                            Store._local.classes.showInfo(color, id, this.instance)
                            this.id = Store._local.methods.getNewId();
                        }
                    }

                    getKey(){
                        return this.key;
                    }

                }
                return new Key(key, color, id);
            },

            Content(content, id = undefined, color = undefined){
                class Content{
                    constructor(content, id, color) {
                        this.content = content;
                        this.instance = "Content";

                        if(id){
                            this.id = Number(id);
                        } else {
                            this.id = Store._local.methods.getNewId();
                        }

                        if(color){
                            this.color = color;
                        } else {
                            Store._local.classes.showInfo(color, id, this.instance)
                            this.color = Store._local.methods.getNewColor();
                        }
                    }
                }
                return new Content(content, id, color)
            }
        },
        methods: {
            //Замыкание
            getNewId: undefined,
            getNewColor: undefined,

            copy(src){
                let copy = undefined;
                if(src !== undefined){
                    if(src.instance === "Lock"){
                        copy = Store._local.classes.Lock(src.id, src.color)
                        copy.key = src.key;
                        copy.isOpen = src.isOpen;

                    } else if (src.instance === "Key"){
                        copy = Store._local.classes.Key(src.key, src.color, src.id);
                    } else if (src.instance === "User"){
                        copy = Store._local.classes.User(src.name, src.id, src.color);
                        copy.inventory = {};
                        let inventoryKeys = Object.keys(src.inventory);
                        inventoryKeys.forEach(key => {
                            let inventoryFieldKeys = Object.keys(src.inventory[key]);
                            copy.inventory[key] = {};
                            inventoryFieldKeys.forEach(innerKey => {
                                copy.inventory[key][src.inventory[key][innerKey].id] = Store._local.methods.copy(src.inventory[key][innerKey]);
                            })
                        })
                    } else if(src.instance === "Box"){
                        function boxLocksCopy(target){
                            let locks = {}
                            let locksKeys = Object.keys(target.locks);
                            locksKeys.forEach(lock => {
                                locks[target.locks[lock].id] = Store._local.methods.copy(target.locks[lock]);
                            })
                            return locks;
                        }
                        copy = Store._local.classes.Box(src.id, src.color);
                        copy.locks = boxLocksCopy(src);

                        let content = undefined;

                        if(src.content !== undefined){ //Проверка на то, что бокс может быть пустым и копировать там нечего
                            if(src.content.instance === "Box"){
                                let currentSrc = src.content;
                                content = Store._local.classes.Box(currentSrc.id, currentSrc.color);
                                let currentCopy = content;
                                let flag = 1;
                                while(flag === 1){
                                    currentCopy.instance = "Box";
                                    currentCopy.locks = boxLocksCopy(currentSrc);

                                    //Внутри бокса может и ничего не быть
                                    if(currentSrc.content !== undefined){
                                        if(currentSrc.content.instance === "Box"){
                                            currentCopy.content = Store._local.classes.Box(currentSrc.content.id, currentSrc.content.color);
                                            currentCopy = currentCopy.content;
                                            currentSrc = currentSrc.content;
                                        } else {
                                            flag = 0;
                                            currentCopy.content = Store._local.methods.copy(currentSrc.content);
                                        }
                                    } else {
                                        flag = 0;
                                    }

                                }
                            } else if(src.content.instance === "Content"){
                                content = Store._local.methods.copy(src.content, src.id, src.color);
                            }
                        }

                        copy.content = content;

                    } else if(src.instance === "Content"){
                        copy = Store._local.classes.Content(src.content, src.id, src.color);
                        copy.content = src.content;
                    }

          /*          copy.instance = src.instance;
                    copy.id = src.id;*/
                }

                return copy;
            },

            jsonCopy(src){
                return JSON.parse(JSON.stringify(src));
            },


            recovery(target){
                Store.state.activeUser = undefined;
                Store.state.users = {};
                Object.keys(target.users).forEach(userKey => {
                    Store.state.users[userKey] = Store._local.methods.copy(target.users[userKey]);
                })
                if(target.activeUser){
                    Store.state.activeUser = Store.state.users[target.activeUser.id];
                }

            },

            changesController(type){
                //let ignoredTypes = ["getUsersData", "logBack", "logNext", "isActiveUser", "getItemData"];
                //Если мы не на самом последнем логе и внесли изменения, все последующие логи удалятся.
                if(!Store.state.ignoredTypes.includes(type)){
                    if(Store.state.logs[Store.state.currentLog + 1] !== undefined){
                        let count = 0;
                        let times = Store.state.logs.length - Store.state.currentLog;
                        for(let i = 0; i < (times - 1); i++){
                            //Удаляем копию стейта
                            Store.state.logs.pop();
                            //Удаляем алгоритмический шаг
                            Store.state.algorithm.pop();
                            count += 1;
                        }
                        //Восстанавливаем данные из логов (изменяем state);
                        this.recovery(Store.state.logs[Store.state.currentLog]);
                    }
                }
            },

            logger(){
                let log = {}
                log.users = {}
                log.activeUser = Store._local.methods.copy(Store.state.activeUser);
                Object.keys(Store.state.users).forEach(userKey => {
                    log.users[userKey] = Store._local.methods.copy(Store.state.users[userKey]);
                })
                Store.state.logs.push(log);
                Store.state.currentLog += 1;
            },

            algorithm(type, props){
                let step = {type, props};
                Store.state.algorithm.push(step);
                Store.state.currentAlgStep += 1;
            },

            logBack(){
                let res = false;
                if(Store.state.currentLog > 0){
                    Store.state.currentLog -= 1;
                    res = true;
                }
                if(Store.state.currentAlgStep > 0){
                    Store.state.currentAlgStep -= 1;
                    res = true;
                }
                return res;
            },
            logNext(){
                let res = false;
                if(Store.state.currentLog < Store.state.logs.length - 1){
                    Store.state.currentLog += 1;
                    res = true;
                }
                if(Store.state.currentAlgStep < Store.state.algorithm.length - 1){
                    Store.state.currentAlgStep += 1;
                    res = true;
                }
                return res;
            }

        }
    }
}



var deepEqual = function (x, y) {
    if (x === y) {
        return true;
    }
    else if ((typeof x == "object" && x != null) && (typeof y == "object" && y != null)) {
        if (Object.keys(x).length !== Object.keys(y).length)
            return false;

        for (var prop in x) {
            if (y.hasOwnProperty(prop))
            {
                if (! deepEqual(x[prop], y[prop]))
                    return false;
            }
            else
                return false;
        }

        return true;
    }
    else
        return false;
}

