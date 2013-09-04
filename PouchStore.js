/* 
 * Copyright (c) 2013, Philippe Sam-Long aka pulsation
 * All rights reserved.
 * 
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met: 
 * 
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer. 
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution. 
 * 
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * A basic (read-only for now) pouchdb dojo store wrapper.
 */
define(["dojo/store/util/QueryResults", "dojo/_base/declare", "dojo/_base/lang", "dojo/store/util/SimpleQueryEngine", "dojo/Deferred"],
        function(QueryResults, declare, lang, SimpleQueryEngine, Deferred){
 
    //  Declare the initial store
    return declare(null, {
        idProperty: "id",
        queryEngine: SimpleQueryEngine,

        // Pouch database
        pouch: null,

        // Pouch query view and options
        pouchQuery: null,

        constructor: function(options){

          lang.mixin(this, options || {});
          this.setTarget(this.target);
          this.setPouchQuery(this.pouchQuery);
        },
        
        /**
         * Used to set a pouch database. 
         * Can either be a string, or a PouchDB instance.
         */
        setTarget: function(dsn) {
          if (dsn) {
            if (typeof dsn === "string") {
              this.pouch = new PouchDB(dsn);
            } else {
              this.pouch = dsn;
            }
          }
        },

        /**
         * Associate the store to a particular CouchDB view query.
         *
         * structure:
         * query {
         *  options: Options to pass to PouchDB when querying view
         *  view: pouch view
         * }
         *
         */
        setPouchQuery: function(query) {
          if (query) {
            this.pouchQuery = query;
          }
        },

        /**
         * Map CouchDB's response to data that SimpleQueryEngine can use.
         */
        mapResponse: function(response) {
          var data = Array();

          response.rows.forEach(
            function(item) {
              data.push(item.value);
            }
          );

          return data;
        },

        /**
         * Query documents. If a view is associated to the store, returns the view result.
         *
         * query is the standard dojo query that will be executed by dojo's SimpleQueryEngine
         * once the view result has been loaded.
         *
         * options are standard dojo query options.
         *
         * pouchQueryExt are specific pouchdb query characteristics that will be mixed in with
         * the initial pouchQuery attribute.
         */
        query: function(query, options, pouchQueryExt){
          var deferred = new Deferred(),
              self = this,

              pouchQuery = lang.mixin(this.pouchQuery, pouchQueryExt || {}),

              // Apply query engine on returned documents
              callback = function (err, response) {
                if (err) {
                  deferred.reject(err);
                } else {
                  deferred.resolve(
                    QueryResults(self.queryEngine(query, options))(self.mapResponse(response))
                  );
                }
              };
          
          if (this.pouch !== null) {
            if (this.pouchQuery === null) {
              // No view to query. All documents are fetched.
              this.pouch.allDocs({include_docs: true}, callback);
            } else {
              data = this.pouch.query(pouchQuery.view, pouchQuery.options, callback);
            }
            return deferred;
          } else {
            return [];
          }
        },

        /**
         * Fill the database with data.
         */
        setData: function(data){
          this.pouch.bulkDocs(data);
        },
        
        /**
         * Get one record by id.
         */
        get: function(id) {
          var deferred = new Deferred();
          this.pouch.get(id, function (err, doc) {
            if (err) {
              deferred.reject(err);
            } else {
              deferred.resolve(doc);
            }
          });
          return deferred;
        },

        // Get item identity.
        getIdentity: function(object){
          return object[this.idProperty];
        }

        // TODO: Regarding http://dojotoolkit.org/documentation/tutorials/1.9/creating_stores/ put, add and remove functions
        // are missing for now.
    });
});

