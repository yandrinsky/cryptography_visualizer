let Dispatcher = {
    state: {
        algorithm: [],
        currentStep: -1,
        isViewMode: false,
    },
    dispatch(type, props){
        let res;
        switch (type){
            case "newUser":
                res = Store.dispatch("newUser", props);
                break
            case "setActiveUser":
                res = Store.dispatch("setActiveUser", props);
                break;
            case "updateUsername":
                res = Store.dispatch("updateUsername", props);
                break;
            case "createKit":
                res = Store.dispatch("createKit");
                break;
            case "sendBox":
                res = Store.dispatch("sendBox", props);
                if(res.data.openedLocks.length > 0 || res.data.isHacked){
                    let data = {};
                    let hackerData = Dispatcher.dispatch("getItemData", {id: res.data.idHacker}).data;
                    data.userColor = hackerData.color;
                    data.userName = hackerData.name;
                    data.locks = [];
                    res.data.openedLocks.forEach(lockId => {
                        data.locks.push(Dispatcher.dispatch("getItemData", {id: lockId}).data.color)
                    })
                    if(res.data.isHacked){
                        data.contentColor = Dispatcher.dispatch("getItemData", {id: res.data.idContent}).data.color
                        data.isHacked = true
                    }
                    UI.methods.showHackError(data);
                }

                break;
            case "shareKey":
                res = Store.dispatch("shareKey", props);
                break;
            case "shareLock":
                res = Store.dispatch("shareLock", props);
                break;
            case "pack":
                res = Store.dispatch("pack", props);
                break;
            case "setLock":
                res = Store.dispatch("setLock", props);
                break;
            case "lock":
                res = Store.dispatch("lock", props);
                break;
            case "unlock":
                res = Store.dispatch("unlock", props);
                break;
            case "openLock":
                res = Store.dispatch("openLock", props);
                break;
            case "closeLock":
                res = Store.dispatch("closeLock", props);
                break;
            case "removeLock":
                res = Store.dispatch("removeLock", props);
                break;
            case "openBox":
                res = Store.dispatch("openBox", props);
                break;
            case "remove":
                res = Store.dispatch("remove", props);
                break;
            case "logBack":
                res = Store.dispatch("logBack", props);
                break
            case "logNext":
                res = Store.dispatch("logNext", props);
                break
            case "copyItem":
                res = Store.dispatch("copyItem", props);
                break
            case "commandConsole":
                res = Dispatcher.methods.commandConsole(props.commands);
                if(res.success){
                    UI.methods.closeCommandConsole();
                    Store.dispatch("newGame");
                    Dispatcher.methods.UIrender();
                    Dispatcher.state.algorithm = res.algorithm;
                    UI.methods.openPlaySettings();
                } else {
                    UI.methods.showCommandsError(res.error);
                }
                break
            case "play_algorithm":
                if(props.type === "video" || props.type === "flash"){
                    Dispatcher.methods.play(Dispatcher.state.algorithm, props.duration);
                } else if (props.type === "steps") {
                    UI.renders.renderPlayArrows();
                    Dispatcher.methods.playByStep("start");
                }
                res = {success: true}
                break

            case "commandConsoleHelp":
                UI.methods.showHelpConsole();
                res = {success: true};
                break;

            case "isActiveUser":
                res = Store.dispatch("isActiveUser");
                break

            case "getItemData":
                res = Store.dispatch("getItemData", props);
                break

            case "playStep":
                res = {success: true};
                Dispatcher.methods.playByStep(props.move);
                break

            case "stopPlay":
                res = {success: true};
                Dispatcher.state.isViewMode = false;
                UI.methods.removePlayArrows();
                UI.methods.removeStopPlayBtn();
                UI.methods.sandBoxMode();
                //console.log("stopPlay", Dispatcher.state.isViewMode);
                break
            case "newGame":
                res = Store.dispatch("newGame");
                break
            case "getAlgorithm":
                res = Store.dispatch("getAlgorithm");
                let commands = Dispatcher.methods.convertAlgorithmToCommands(res.data);
                let text = "";
                commands.forEach(el => {
                    text +=  el + "\n"
                })
                UI.methods.openCommandsConsole();
                UI.methods.hideAlgTabs();
                UI.methods.insertCommandsIntoConsole(text);
                UI.methods.showCommandsError({description: "Текущий алгоритм", line: 1});
                break;
        }
        //console.log("type ", type, "result is: ",  res.success);
        let UIignoredCommands = ["getItemData", "playStep", "commandConsoleHelp", "play_algorithm", "isActiveUser"];

        if(!(type in UIignoredCommands)){
            Dispatcher.methods.UIrender();
            if(Dispatcher.state.isViewMode){
                UI.methods.viewMode();
            }
        }

        return res;
        
    },

    methods: {
        UIrender(){
            let data = Store.dispatch("getUsersData").data;
            if(data.users !== undefined){
                UI.renders.renderUsers(data);
            }
            if(data.activeUser !== undefined){
                UI.renders.renderInventory(data.activeUser.inventory);
            } else {
                UI.renders.inventoryCellsRender();
            }
        },

        stepEffect(step, stepDuration){
            if(step.type === "newUser"){
                UI.effects.touch.newUser()
            } else if (step.type === "createKit"){
                UI.effects.touch.getKit()
            } else if(step.type === "logBack"){
                UI.effects.touch.logBack()
            } else if(step.type === "logNext"){
                UI.effects.touch.logNext()
            }

            if(step.type === "setLock"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props.idLock}).data;
                setTimeout(()=> {
                    UI.effects.drop.toBox(step.props.idBox, info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "sendBox"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props.idBox}).data;
                setTimeout(()=> {
                    UI.effects.drop.toUser(step.props.where, info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "remove"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props[Object.keys(step.props)[0]]}).data;
                setTimeout(()=> {
                    UI.effects.drop.toTrash(info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "unlock"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props.idKey}).data;
                setTimeout(()=> {
                    UI.effects.drop.toBox(step.props.idBox, info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "shareLock"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props.idLock}).data;
                setTimeout(()=> {
                    UI.effects.drop.toUser(step.props.where, info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "shareKey"){
                let info = Dispatcher.dispatch("getItemData", {id: step.props.idKey}).data;
                setTimeout(()=> {
                    UI.effects.drop.toUser(step.props.where, info.instance, info.color, stepDuration);
                }, 0)
            } else if(step.type === "pack"){
                let id;
                (step.props.idPackBox) ? id = step.props.idPackBox : id = step.props.idPackContent;
                let info = Dispatcher.dispatch("getItemData", {id}).data;
                setTimeout(()=> {
                    UI.effects.drop.toBox(step.props.idBox, info.instance, info.color, stepDuration);
                }, 0)
            }
        },

        play(algorithm, stepDuration = 1500){
            Dispatcher.state.isViewMode = true;
            algorithm.forEach((step, id)=>{
                setTimeout(()=>{
                    UI.methods.closeHackError();
                    if(stepDuration > 0){
                        this.stepEffect(step, stepDuration);
                    }
                    Dispatcher.dispatch(step.type, step.props);
                }, stepDuration * (id + 1))
            });
            setTimeout(()=>{
                UI.methods.sandBoxMode();
                Dispatcher.state.isViewMode = false;
            }, stepDuration * (algorithm.length) + 100)

        },


        playByStep(move){
            if(move === "start"){
                Dispatcher.state.isViewMode = true;
                Store.dispatch("newGame");
                UI.renders.renderStopPlayBtn();
                Dispatcher.state.currentStep = -1;
            } else if(move === "next"){
                if(Dispatcher.state.currentStep < Dispatcher.state.algorithm.length - 1){
                    Dispatcher.state.currentStep += 1;
                    let step = Dispatcher.state.algorithm[Dispatcher.state.currentStep];
                    this.stepEffect(step, 1000);
                    Dispatcher.dispatch(step.type, step.props);
                }
            } else if(move === "before"){
                if(Dispatcher.state.currentStep > 0){
                    Store.dispatch("newGame");
                    for(let i = 0; i < Dispatcher.state.currentStep; i++){
                        let step = Dispatcher.state.algorithm[i];
                        Dispatcher.dispatch(step.type, step.props);
                    }
                    // if(Dispatcher.state.algorithm[Dispatcher.state.currentStep - 2] !== undefined){
                    //     this.stepEffect(Dispatcher.state.algorithm[Dispatcher.state.currentStep - 2], 1000);
                    // }
                    Dispatcher.state.currentStep -= 1;
                } else if(Dispatcher.state.currentStep === 0){
                    Store.dispatch("newGame");
                    Dispatcher.state.currentStep -= 1;
                }
            }


            //console.log("playByStep. move is", move, "step is", Dispatcher.state.algorithm[Dispatcher.state.currentStep])
        },

        commandConsole(commands){
            this.start();

            let names = {};
            let currentLine;
            let activeUser;
            let algorithm = [];
            let error = {
                isError: false,
                description: undefined,
                line: undefined,
            }

            let methods = {
                algorithm(type, props){
                    algorithm.push({type, props})
                },
                createError(description = "Неизвестная ошибка"){
                    error.isError = true;
                    error.line = currentLine;
                    error.description = description;
                },
                removeName(name){
                    delete names[name];
                },
            }

            let preparation = {
                newName(name, errorDescription){
                    if(name !== undefined){
                        if(name in names){
                            methods.createError(`Имя ${name} уже занято`);
                        } else {
                            names[name] = "taken";
                        }
                    } else {
                        methods.createError(errorDescription);
                    }
                },
                isActiveUser() {
                    if(!Dispatcher.dispatch("isActiveUser").success){
                        methods.createError("Не установлен активный пользователь");
                    }
                },

                isOwner(owners, name){
                    let res = false;
                    owners.forEach(el =>{
                        if(el.name === name){
                            res = true;
                        }
                    })
                    return res;
                },

                findItemByName(name, callback){
                    let data;
                    if(name !== undefined){
                        if(name in names){
                            if(names[name].owners === undefined || this.isOwner(names[name].owners, activeUser.name)){
                                data = callback(names[name]);
                            } else {
                                //Получаем имена владельцев элемента;
                                let ownersNames = "";
                                let error;
                                names[name].owners.forEach(el => {
                                    ownersNames += ", " + el.name
                                })
                                let len = ownersNames.length
                                ownersNames = ownersNames.slice(1, ownersNames.length); //убираем лишнюю запятую в начале:
                                if(names[name].length === 1){
                                    error = `Попытка доступа к элементу, принадлежащему пользователь ${ownersNames}, 
                                    когда активен ${activeUser.name}`;
                                } else {
                                    error = `Попытка доступа к элементу, принадлежащему пользователям ${ownersNames}, 
                                    когда активен ${activeUser.name}`;
                                }
                                methods.createError(error);
                            }
                        } else {
                            methods.createError(`Имя ${name} не определено`);
                        }
                    } else {
                        methods.createError(`Не указано имя элемента`);
                    }
                    return data;
                },

                convertNameToId(name){
                    let id = this.findItemByName(name,item => {
                        return item.id;
                    })

                    return id;
                },

                convertNameToInstance(name){
                    let instance = this.findItemByName(name,item => {
                        return item.instance;
                    })
                    return instance;
                },

                addOwner(name, newOwner){
                    if(newOwner === "public"){
                        //перебираем все зареганые имена
                        Object.keys(names).forEach(el => {
                            //выбираем только тех, кто User
                            if(names[el].instance === "User"){
                                let isExist = false;
                                //смотрим, нет ли такого имени уже во владельцах
                                names[name].owners.forEach(owner => {
                                    if(owner.name === el){
                                        isExist = true;
                                    }
                                })
                                //если такого имени еще нет, добавляем
                                if(!isExist){
                                    names[name].owners.push({id: names[el].id, name: names[el].name})
                                }
                            }
                        })

                    } else {
                        names[name].owners.push({id: names[newOwner].id, name: names[newOwner].name})
                    }

                },

                changeOwner(name, newOwner){
                    names[name].owners = [{id: names[newOwner].id, name: names[newOwner].name}]
                },

                setNewName(name, id, instance, ownerName){
                    names[name] = {id, name, instance, owners: []};
                    if(ownerName){
                        this.addOwner(name, ownerName);
                    } else { //Если объект = User, то у него нет владельцев
                        names[name].owners = undefined;
                    }


                }
            }

            commands = commands.split("\n");

            for(let i = 0; i < commands.length; i++){
                //разбиваем строки на отдельные команды по пробелу
                commands[i] = commands[i].split(" ");
                //перебираем каждое слово
                for(let j = 0; j < commands[i].length; j++){
                    //чистим каждое слово от пробелов
                    commands[i][j] = commands[i][j].trim();
                    //если слово оказалось только из пробелов - удаляем его
                    if(commands[i][j] === ""){
                        commands[i].splice(j, 1);
                        j -= 1;
                    }
                }
                //если в строке не оказалось слов - удаляем её
                if(commands[i].length === 0){
                    commands.splice(i, 1);
                    i -= 1;
                }

            }

            //обрабатываем каждую команду
            for(let i = 0; i < commands.length && error.isError === false; i++){
                let command = commands[i];
                let props = {};
                currentLine = i + 1;

                if(command[0] === "new"){
                    if(command[1] !== undefined){
                        if(command[1] === "user"){
                            if(command[2] === "as"){
                                preparation.newName(command[3], "Не указано имя при создании нового пользователя");
                                if(!error.isError){
                                    props = {name: command[3]};
                                    let data = Dispatcher.dispatch("newUser", props).data;
                                    algorithm.push({type: "newUser", props});
                                    preparation.setNewName(command[3], data.id, data.instance, undefined);
                                    //names[command[3]] = {id: data.id, instance: data.instance, owner: undefined};
                                }
                            } else {
                                methods.createError("пропущено ключевое слово: as");
                            }
                        } else {
                            methods.createError(`команда new может создавать только элемент типа user, получено ${command[1]}`)
                        }
                    } else {
                        methods.createError("после ключевого слова new должен следовать элемент");
                    }
                }

                else if (command[0] === "get"){
                    if(command[1] === "kit"){
                        if(command[2] === "as"){
                            preparation.newName(command[3], "Не указано имя при выдаче набора");
                            preparation.isActiveUser();
                            if(!error.isError){
                                let data = Dispatcher.dispatch("createKit").data;
                                methods.algorithm("createKit", {})
                                preparation.setNewName(command[3], undefined, "Kit", activeUser.name);
                                preparation.setNewName(command[3] + "_box", data["Box"].id, data["Box"].instance, activeUser.name);
                                preparation.setNewName(command[3] + "_lock", data["Lock"].id, data["Lock"].instance, activeUser.name);
                                preparation.setNewName(command[3] + "_key", data["Key"].id, data["Key"].instance,  activeUser.name);
                                preparation.setNewName(command[3] + "_content", data["Content"].id, data["Content"].instance,  activeUser.name);
                            }
                        } else {
                            methods.createError("пропущено ключевое слово: as");
                        }
                    } else {
                        if(command[1] !== undefined){
                            methods.createError(`Команда get не поддерживает опцию ${command[1]}. Возможно, вы имеете в виду get kit`);
                        } else {
                            methods.createError("Неполная команда. Возможно, вы имеете в виду get kit");
                        }

                    }


                } else if(command[0] === "set"){
                    if(command[1] === "active" && command[2] === "user"){
                        let id = preparation.convertNameToId(command[3]);
                        let instance = preparation.convertNameToInstance(command[3])
                        if(!error.isError){
                            if(instance === "User"){
                                props = {idUser: id};
                                Dispatcher.dispatch("setActiveUser", props)
                                methods.algorithm("setActiveUser", props)
                                activeUser = {id, name: command[3]};
                            } else {
                                methods.createError(`Попытка задать активнового пользователя как элемент типа ${instance}`);
                            }

                        }
                    } else if(command[1] === "lock"){
                        let idLock = preparation.convertNameToId(command[2]);
                        let instanceLock = preparation.convertNameToInstance(command[2]);
                        preparation.isActiveUser();
                        if(!error.isError){
                            if(instanceLock === "Lock"){
                                if(command[3] === "on"){
                                    let idBox =  preparation.convertNameToId(command[4]);
                                    let instanceBox =  preparation.convertNameToInstance(command[4]);
                                    if(!error.isError){
                                        if(instanceBox === "Box"){
                                            props = {idBox, idLock};
                                            Dispatcher.dispatch("setLock", props);
                                            methods.algorithm("setLock", props);
                                        } else {
                                            methods.createError(`команда set lock поддерживает только элементы типов Lock -> Box`);
                                        }

                                    }
                                } else {
                                    methods.createError("пропущено ключевое слово: on");
                                }
                            } else {
                                methods.createError(`команда set lock поддерживает только элементы типов Lock -> Box`);
                            }

                        }
                    } else {
                        if(command[1] === undefined){
                            methods.createError(`Неполная команда. Возможно, вы имели в виду set active user / set lock`);
                        } else {
                            methods.createError(`команда set не поддерживает опцию ${command[1]}. Возможно, вы имели в виду set active user / set lock`);
                        }

                    }
                } else if(command[0] === "remove"){
                        let id = preparation.convertNameToId(command[1]);
                        let instance = preparation.convertNameToInstance(command[1]);
                        preparation.isActiveUser();
                        if(!error.isError) {
                            if (instance === "Box") {
                                props.idBox = id;
                            } else if (instance === "Key") {
                                props.idKey = id;
                            } else if (instance === "Lock") {
                                props.idLock = id;
                            } else if (instance === "Content") {
                                props.idContent = id;
                            } else if (instance === "User") {
                                props.idUser = id;
                            }

                            methods.algorithm("remove", props);
                            Dispatcher.dispatch("remove", props);
                            methods.removeName(command[1]);
                        }

                } else if(command[0] === "pack"){
                    let id = preparation.convertNameToId(command[1]);
                    let instance = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instance === "Box"){
                            props.idPackBox = id;
                        } else if(instance === "Content"){
                            props.idPackContent = id;
                        } else {
                            methods.createError(`команда pack упаковывает только элементы типов Box/Content. Получен ${instance}`);
                        }
                        if(!error.isError){
                            if(command[2] === "in"){
                                let idBox = preparation.convertNameToId(command[3]);
                                let instanceBox = preparation.convertNameToInstance(command[3]);
                                if(!error.isError){
                                    if(instanceBox === "Box"){
                                        if(id !== idBox){
                                            props.idBox = idBox;
                                            methods.algorithm("pack", props);
                                            Dispatcher.dispatch("pack", props);
                                        } else {
                                            methods.createError("попытка упаковать элемент типа Box в себя же");
                                        }
                                    } else {
                                        methods.createError(`команда pack упаковывает элементы только в тип Box. Получен ${instanceBox}`);
                                    }
                                }
                            } else{
                                methods.createError("Пропущено ключевое слово: in");
                            }
                        }
                    }
                } else if(command[0] === "unlock"){
                    let idBox = preparation.convertNameToId(command[1]);
                    let instanceBox = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instanceBox === "Box"){
                            if(command[2] === "with"){
                                let idKey = preparation.convertNameToId(command[3]);
                                let instanceKey = preparation.convertNameToInstance(command[3]);
                                if(!error.isError){
                                    if(instanceKey === "Key"){
                                        props = {idBox, idKey};
                                        Dispatcher.dispatch("unlock", props);
                                        methods.algorithm("unlock", props);
                                    } else {
                                        methods.createError(`команда unlock может открыть элемент только элементом типа Key. Получено ${instanceKey}`);
                                    }
                                }
                            } else {
                                methods.createError("Пропущено ключевое слово: with");
                            }
                        } else {
                            methods.createError(`команда unlock может открыть только элемент типа Box. Получено ${instanceBox}`);
                        }

                    }
                } else if(command[0] === "open"){
                    let idBox = preparation.convertNameToId(command[1]);
                    let instanceBox = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instanceBox === "Box"){
                            props.idBox = idBox;
                            Dispatcher.dispatch("openBox", props);
                            methods.algorithm("openBox", props);
                        } else {
                            methods.createError(`команда open возможна только для элементов типа box. Получено ${instanceBox}`);
                        }
                    }

                } else if(command[0] === "send"){
                    let idBox = preparation.convertNameToId(command[1]);
                    let instanceBox = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instanceBox === "Box"){
                            if(command[2] === "to"){
                                let idUser = preparation.convertNameToId(command[3]);
                                let instanceUser = preparation.convertNameToInstance(command[3]);
                                if(instanceUser === "User"){
                                    props.idBox = idBox;
                                    props.where = idUser;
                                    preparation.changeOwner(command[1], command[3]);
                                    methods.algorithm("sendBox", props);
                                    let sendRes = Dispatcher.dispatch("sendBox", props);
                                    if(sendRes.data.isHacked){
                                        methods.createError(`Box взломан пользователем 
                                        ${Dispatcher.dispatch("getItemData", {id: sendRes.data.idHacker}).data.name}. Дальнейшие действия могут
                                         привести к неожиданным ошибкам`)
                                    }
                                    UI.methods.closeHackError()
                                    UI.methods.dark();


                                } else {
                                    methods.createError("команда send возможна только для элементов типа Box -> User");
                                }
                            } else {
                                methods.createError("Пропущено ключевое слово: to");
                            }
                        } else {
                            methods.createError("команда send возможна только для элементов типа Box -> User");
                        }
                    }
                } else if(command[0] === "share"){
                    let idItem = preparation.convertNameToId(command[1]);
                    let instanceItem = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instanceItem === "Key" || instanceItem === "Lock"){
                            if(command[2] === "with"){
                                let idUser = preparation.convertNameToId(command[3]);
                                let instanceUser = preparation.convertNameToInstance(command[3]);
                                if(!error.isError){
                                    if(instanceUser === "User"){
                                        if(idUser !== activeUser.id){
                                            props.where = idUser;
                                            if(instanceItem === "Key"){
                                                props.idKey = idItem;
                                                Dispatcher.dispatch("shareKey", props);
                                                preparation.addOwner(command[1], "public");
                                                methods.algorithm("shareKey", props);
                                            } else {
                                                props.idLock = idItem;
                                                Dispatcher.dispatch("shareLock", props);
                                                preparation.addOwner(command[1], command[3]);
                                                methods.algorithm("shareLock", props);
                                            }
                                        } else {
                                            methods.createError("попытка поделиться предметом с самим собой");
                                        }


                                    } else {
                                        methods.createError("команда share возможна только для элементов типа Box -> User");
                                    }
                                }
                            } else {
                                methods.createError("Пропущено ключевое слово: with");
                            }
                        } else {
                            methods.createError("команда share возможна только для элементов типа Lock / Key -> User");
                        }
                    }
                } else if(command[0] === "copy"){
                    let idItem = preparation.convertNameToId(command[1]);
                    let instanceItem = preparation.convertNameToInstance(command[1]);
                    preparation.isActiveUser();
                    if(!error.isError){
                        if(instanceItem !== "User"){
                            if(command[2] === "as"){
                                preparation.newName(command[3], "Не указано имя при копировании элемента");
                                if(!error.isError){
                                    props.id = idItem;
                                    props.instance = instanceItem;
                                    names[command[3]] = Dispatcher.dispatch("copyItem", props).data;
                                    methods.algorithm("copyItem", props);
                                }
                            } else {
                                methods.createError("Пропущено ключевое слово as");
                            }
                        } else {
                            methods.createError("команда copy невозможна для элемента типа User");
                        }
                    }
                } else if(command[0] === "help"){
                    Dispatcher.dispatch("commandConsoleHelp");
                    methods.createError("список команд")
                }

                else {
                    let command = commands[0][0]
                    if(command.length > 8){
                        command = command.slice(0, 8) + `..`;
                    }
                    methods.createError(`<div>Неизвестная комманда: ${command}. </div><div>Введите help для получения списка команд</div>`);
                }
            }

            if(error.isError){
                return {success: false, error};

            } else {
                return {success: true, algorithm};
            }
        },

        convertAlgorithmToCommands(algorithm){
            function isNameExist(name){
                let res = undefined;
                for(let i = 0; i < names.length; i++){
                    if(names[i].name === name){
                        res = {name: names[i].name, id: names[i].id};
                        break
                    }
                }
                return res;
            }

            function addName(name, id){
                if(isNameExist(name)){
                    for(let i = 1; i < 50; i++){
                        //ситуация при создании пользователей с одинаковыми именами
                        //если такое имя уже есть, то проверяем имя_1, имя_2
                        if(!isNameExist(name + "_" + i)){
                            name = name + "_" + i
                            break
                        }
                    }
                }
                names.push({name, id});
                return name;
            }

            function getNameById(id){
                let res = undefined;
                for(let i = 0; i < names.length; i++){
                    if(names[i].id == id){
                        res = names[i].name
                        break
                    }
                }
                if(res === undefined){
                    throw new Error(`Имя по id ${id} не найдено.`);
                }
                return res;
            }

            let alg = algorithm.slice(0, algorithm.length);
            let activeUser;
            let names = [];
            let commands = [];
            if(alg[0].type === "newGame"){
                alg.splice(0, 1);
            }
            Dispatcher.dispatch("newGame");
            for(let i = 0; i < alg.length; i++){
                let type = alg[i].type;
                let props = alg[i].props;

                let res = Dispatcher.dispatch(type, props);


                if(res.success){
                    res = res.data;
                    if(type === "newUser"){
                        let name = props.name;
                        let id = res.id;

                        for(let j = i + 1; j < alg.length; j++){
                            if(alg[j].type === "updateUsername"){
                                name = alg[j].props.name;
                                alg.splice(j, 1);
                                break
                            }
                        }
                        name = addName(name, id);
                        commands.push(`new user as ${name}`);
                    } else if(type === "setActiveUser"){
                        let name = getNameById(props.idUser);
                        commands.push(`set active user ${name}`);
                        activeUser = name;
                    } else if(type === "createKit"){
                        let name = addName(`${activeUser}_kit`, undefined);
                        addName(`${name}_box`, res.Box.id);
                        addName(`${name}_key`, res.Key.id);
                        addName(`${name}_lock`, res.Lock.id);
                        addName(`${name}_content`, res.Content.id);
                        commands.push(`get kit as ${name}`);
                    } else if(type === "sendBox"){
                        let nameBox = getNameById(props.idBox);
                        let nameUser = getNameById(props.where);
                        commands.push(`send ${nameBox} to ${nameUser}`);
                    } else if(type === "shareKey"){
                        let nameKey = getNameById(props.idKey);
                        let nameUser = getNameById(props.where);
                        commands.push(`share ${nameKey} with ${nameUser}`);
                    } else if(type === "shareLock"){
                        let nameLock = getNameById(props.idLock);
                        let nameUser = getNameById(props.where);
                        commands.push(`share ${nameLock} with ${nameUser}`);
                    } else if(type === "pack"){
                        let nameBox = getNameById(props.idBox);
                        let packItem;
                        if(props.idPackBox){
                            packItem = getNameById(props.idPackBox);
                        } else if(props.idPackContent){
                            packItem = getNameById(props.idPackContent);
                        }
                        commands.push(`pack ${packItem} in ${nameBox}`);
                    } else if(type === "setLock"){
                        let nameBox = getNameById(props.idBox);
                        let nameLock = getNameById(props.idLock);
                        commands.push(`set lock ${nameLock} on ${nameBox}`);
                    } else if(type === "unlock"){
                        let nameBox = getNameById(props.idBox);
                        let nameKey = getNameById(props.idKey);
                        commands.push(`unlock ${nameBox} with ${nameKey}`);
                    } else if(type === "openBox"){
                        let nameBox = getNameById(props.idBox);
                        commands.push(`open ${nameBox}`);
                    } else if(type === "remove"){
                        let keys = Object.keys(props);
                        let itemId;
                        keys.forEach(key => {
                            if(props[key]){
                                itemId = props[key];
                            }
                        })
                        let nameItem = getNameById(itemId);
                        commands.push(`remove ${nameItem}`);
                    } else if(type === "copyItem"){
                        let itemId = props.id;
                        let name = getNameById(itemId);
                        let newName = addName(name, res.id);
                        commands.push(`copy ${name} as ${newName}`);
                    }
                }


            }
            Dispatcher.dispatch("newGame");
            return commands;


        },

        start(){
            Store.dispatch("newGame");
            // Store.dispatch("newUser", {name: "1"});
            // Store.dispatch("newUser", {name: "2"});
            // Store.dispatch("newUser", {name: "3"});
            // Store.dispatch("setActiveUser", {idUser: 1});
            // Store.dispatch("createKit");
            // Store.dispatch("pack", {idBox: 4, idPackContent: 7});
            // Store.dispatch("shareKey", {idKey: 6, where: 2});
            UI.methods.start();
            this.UIrender();
        }
    }
}

Dispatcher.methods.start();