var footer = {"text": "Flagged User Discord Tracker | v1.0 | By Repz Sep"} //footer, change it to your server information if you want
var joinColorValue = 7506394; //set discord embed color here (0 = black)
var leaveColorValue = 0;
var webhookUrl = ""; //fill this with discord webhook url
var addressPrefix = "";

var plugin = {
    author: 'sepehr-gh',
    version: 2.0,
    name: 'Flagged User Discord Tracker',
    logger: null,

    //helpers
    setCharAt: function(str,index,chr) {
        if(index > str.length-1) return str;
        return str.substring(0,index) + chr + str.substring(index+1);
    },

    cleanHostname: function(hostname){
        var index = 0;
        do{
            index = hostname.indexOf("^");
            hostname = this.setCharAt(hostname, index, "");
            hostname = this.setCharAt(hostname, index, "");
        }while(index !== -1);

        return hostname;
    },

    getFlagReason: function(client, server){
        var reason = "unknown";
        try{
            var changed = false;
            var penalties = server.Manager.GetPenaltyService().GetActivePenaltiesAsync(client.AliasLinkId, client.CurrentAlias.IPAddress, false).Result;
            penalties.forEach(function(penalty){
                if(penalty.Type === 2 && !changed){
                    reason = penalty.Offense;
                    changed = true;
                }
            });
            if(!changed){
                penalties = server.Manager.GetPenaltyService().GetActivePenaltiesAsync(client.AliasLinkId).Result;
                penalties.forEach(function(penalty){
                    if(penalty.Type === 2 && !changed){
                        reason = penalty.Offense;
                        changed = true;
                    }
                });
            }
        }catch(error){
            this.logger.WriteWarning('There was an error while retreiving flag reason from server ' + error.message);
        }finally{
            return reason;
        }
    },
    
    //logic methods
    sendDiscordMessage: function(username, servername, join, ip = "unknown", NetworkId = "unknown", flagReason = "unkown", clientId = 0) {
        var embed;
        if(join){
            embed = {
                "title": "**Player has been tracked**",
                "description": "Attention! Flagged player **" + username + "** (["+clientId+"]("+addressPrefix + clientId+")) has joined server.\n" +
                                "Reason: **"+ flagReason +"**\n"+
                                "Server: **"+ servername+"**\n"+
                                "Client IP: **"+ip+"**\n"+
                                "NetworkId (GUID): **"+NetworkId+"**\n",
                "color": joinColorValue,
                "timestamp": new Date().toISOString(),
                "footer": footer
            };
        }else{
            embed = {
                "description": "Flagged player **" + username + "** has left server.",
                "color": leaveColorValue
            };
        }
        var embeds = []; embeds[0] = embed;
        var webhookData = {"embeds": embeds};
        
        try {
            var client = new System.Net.Http.HttpClient();
            client.DefaultRequestHeaders.Add("User-Agent", "iw4admin plugin");
            var content = new System.Net.Http.StringContent(JSON.stringify(webhookData), System.Text.Encoding.UTF8, "application/json");
            var result = client.PostAsync(webhookUrl, content).Result;
            result.Dispose();
            client.Dispose();
        } catch (error) {
            this.logger.WriteWarning('There was a problem sending message to discord ' + error.message);
        }
    },


    onEventAsync: function (gameEvent, server) {
        if ((gameEvent.Type === 4 || gameEvent.Type === 5 || gameEvent.Type === 6) && gameEvent.Origin.ClientPermission.Level === 1) {
            let cleanHostname = this.cleanHostname(server.Hostname);
            let flagReason = this.getFlagReason(gameEvent.Origin, server);
            this.sendDiscordMessage(
                gameEvent.Origin.CleanedName,
                cleanHostname,
                gameEvent.Type === 4,
                gameEvent.Origin.IPAddressString,
                gameEvent.Origin.NetworkId,
                flagReason,
                gameEvent.Origin.ClientId
            )
        }
    },

    onLoadAsync: function (manager) {
    },

    onUnloadAsync: function () {
    },

    onTickAsync: function (server) {
    }
};
