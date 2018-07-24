var apiproxy = (function () {
    var globalLogSwitch = false;
    var totalDataEndpoint = "./data/toc2.json";
    var originEntities = [];
    var nextSubIds = {};
    var outputEntities = {};
    var _dictMajorIdEntities = {};
    var _dictFullIdEntities = {};
    var allEntitiesIdList = [];
    var defaultEntityList = [];
    var defaultEntityId = "__default__";
    var getAndUpdateSubId = function (majorId) {
        if (nextSubIds[majorId] == null) {
            nextSubIds[majorId] = 0;
        }
        var currentSubId = nextSubIds[majorId];
        nextSubIds[majorId]++;
        return currentSubId;
    };
    var getFullId = function (majorId, subId) {
        var fullId = majorId + "-" + subId;
        return fullId;
    };
    var getMajorId = function (fullId) {
        var pattern = /(^\w+)-(\w+$)/;
        var tmpRes = pattern.exec(fullId);
        var majorId = tmpRes[1];
        return majorId;
    };
    var getSubId = function (fullId) {
        var pattern = /(^\w+)-(\w+$)/;
        var tmpRes = pattern.exec(fullId);
        var subId = tmpRes[2];
        return subId;
    };
    var convertOriginMethodsToDictMethods = function (originMethods) {
        var dictMethods = {};
        for (var i in originMethods) {
            var originMethod = originMethods[i];
            var methodName = originMethod["name"];
            var url = originMethod["url"];
            var dictMethod = {};
            dictMethod["url"] = url;
            dictMethods[methodName] = dictMethod
        }
        return dictMethods;
    };
    var convertOriginEntitiesToDictEntities = function (originEntities) {
        var dictMajorIdEntities = {};
        var dictFullIdEntities = {};
        var recursion = function (originEntities) {
            var currentDictMajorIdEntities = {};
            var currentDictFullIdEntities = {};
            for (var i in originEntities) {
                var originEntity = originEntities[i];
                var id = originEntity["id"];
                var subId = getAndUpdateSubId(id);
                var fullId = getFullId(id, subId);
                var dictMajorIdEntity = {};
                var dictFullIdEntity = {};
                var name = originEntity["name"];
                var url = originEntity["url"];
                var originMethods = originEntity["methods"];
                var distMethods = convertOriginMethodsToDictMethods(originMethods);
                var subOriginEntities = originEntity["entities"];
                var subDictEntitiesTmpRes = recursion(subOriginEntities);
                var subDictMajorIdEntities = subDictEntitiesTmpRes[0];
                var subDictFullIdEntities = subDictEntitiesTmpRes[1];
                var relationMajorIdEntities = {};
                var relationFullIdEntities = {};
                for (var subMajorId in subDictMajorIdEntities) {
                    relationMajorIdEntities[subMajorId] = {};
                }
                for (var subFullId in subDictFullIdEntities) {
                    relationFullIdEntities[subFullId] = {};
                }
                dictMajorIdEntity["name"] = name;
                dictFullIdEntity["name"] = name;
                dictMajorIdEntity["url"] = url;
                dictFullIdEntity["url"] = url;
                dictMajorIdEntity["dict_methods"] = distMethods;
                dictFullIdEntity["dict_methods"] = distMethods;
                dictMajorIdEntity["relation_entities"] = relationMajorIdEntities;
                dictFullIdEntity["relation_full_id_entities"] = relationFullIdEntities;
                if (currentDictMajorIdEntities[id] == null) currentDictMajorIdEntities[id] = dictMajorIdEntity;
                currentDictFullIdEntities[fullId] = dictFullIdEntity;
                if (dictMajorIdEntities[id] == null) dictMajorIdEntities[id] = dictMajorIdEntity;
                dictFullIdEntities[fullId] = dictFullIdEntity;
            }
            return [currentDictMajorIdEntities, currentDictFullIdEntities];
        };
        recursion(originEntities);
        return [dictMajorIdEntities, dictFullIdEntities];
    };
    var getCurrentLevelList = function (entities) {
        var idList = [];
        for (var id in entities) {
            idList.push(id);
        }
        return idList;
    };
    var convertDictEntityToOutputEntity = function (dictEntity) {
        var outputEntity = {};
        outputEntity["name"] = dictEntity["name"];
        outputEntity["url"] = dictEntity["url"];
        outputEntity["methods"] = dictEntity["dict_methods"];
        var relationEntities = [];
        for (var relationEntityId in dictEntity["relation_dict_entities"]) {
            relationEntities.push(relationEntityId);
        }
        outputEntity["relation_entities"] = relationEntities;
        return outputEntity;
    };
    var convertDictEntitiesToOutputEntities = function (dictEntities) {
        var outputEntities = {};
        for (var id in dictEntities) {
            var dictEntity = dictEntities[id];
            var outputEntity = convertDictEntityToOutputEntity(dictEntity);
            outputEntities[id] = outputEntity;
        }
        return outputEntities;
    };
    var makeDefaultEntity = function () {
        var defaultEntity = {};
        defaultEntity["id"] = defaultEntityId;
        defaultEntity["name"] = "Default";
        defaultEntity["url"] = "https://developer.microsoft.com/zh-cn/graph/docs/concepts/overview";
        defaultEntity["methods"] = {};
        var relationEntities = ["applications", "channels", "contacts", "devices", "domains", "settings", "shares", "sites", "subscriptions", "team", "users", ];
        defaultEntity["relation_entities"] = relationEntities;
        return defaultEntity;
    }
    $.getJSON(totalDataEndpoint, function (data) {
        originEntities = data;
        var dictEntitiesTmpRes = convertOriginEntitiesToDictEntities(originEntities);
        _dictMajorIdEntities = dictEntitiesTmpRes[0];
        _dictFullIdEntities = dictEntitiesTmpRes[1];
        outputEntities = convertDictEntitiesToOutputEntities(_dictMajorIdEntities);
        defaultEntityList = getCurrentLevelList(_dictMajorIdEntities);
    });

    for (var entityName in outputEntities) {
        var entity = {};
        entity["name"] = entityName;
        entity["url"] = outputEntities[entityName].url;
        allEntitiesIdList.push(entity);
    }

    var getEntities = function() {
        return allEntitiesIdList;
    };
    
    var getEntity = function (entityId) {
        var entity;
        if (entityId == defaultEntityId) {
            entity = makeDefaultEntity();
        } else {
            entity = outputEntities[entityId]
        }
        return entity;
    };
    
    var getDefaultEntity = function () {
        var defaultEntity = makeDefaultEntity();
        return defaultEntity;
    };

    var getEntityMethods = function (entityId) {
        var entity = getEntity(entityId);
        var methods = entity["methods"];
        return methods;
    };

    var setGlobalLogSwitch = function (status) {
        if (status) globalLogSwitch = true;
        else globalLogSwitch = false;
    };

    return {
        getEntities: getEntities,
        getEntity: getEntity,
        getDefaultEntity: getDefaultEntity,
        getEntityMethods: getEntityMethods,
        setGlobalLogSwitch: setGlobalLogSwitch,
    };
})();