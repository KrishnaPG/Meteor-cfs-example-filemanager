FS.debug = true; 

Stores = {};
Stores.any = new FS.Store.FileSystem("any");

Cases = new Meteor.Collection("cases");
UserData = new Meteor.Collection("userData");
Filesystem = new FS.Collection("filesystem", { 
	stores: [Stores.any],
	chunkSize: 4 * 1024 * 1024,
	autopublish: false 
});

Filesystem.allow({
  insert: function(userId, myFile) { return userId && myFile.owner === userId; },
  update: function(userId, files, fields, modifier) {
	return _.all(files, function (myFile) {
	  return (userId == myFile.owner);

    });  //EO interate through files
  },
  remove: function(userId, file) { 
	return (userId == file.owner);
  }
});

if (Meteor.isClient) {
    // Use session for setting filter options
    Session.setDefault('filter', { completed: '', reversed: true, owner: true, sortBy: 'filename', limit: 5 });

	// Make subscription depend on the current filter
	Deps.autorun(function() {
      var filter = Session.get('filter');
      Meteor.subscribe('listFilesystem', filter);
    });
}

if (Meteor.isServer) {
    // example #1 - manually publish with an optional param
    Meteor.publish('listFilesystem', function(filter) {
    	var filterQuery = {};
    	var filterOptions = {};
    	
    	if ( filter.completed === true || filter.completed === false)
    		filterQuery.complete = filter.completed;
    	
    	if ( filter.owner === true )
    		filterQuery.owner = this.userId;

    	if ( filter.sortBy && filter.sortBy == ''+filter.sortBy && filter.sortBy != '') {
    		var query = {};
    		query[filter.sortBy] = (filter.reversed)? 1 : -1;
    		filterOptions.sort = query;
    	}

    	if ( filter.limit && +filter.limit == +filter.limit )
    		filterOptions.limit = +filter.limit;

      // sort by handedAt time and only return the filename, handledAt and _id fields
      return Filesystem.find( filterQuery, filterOptions );

    }); // EO Publish

} // EO isServer
