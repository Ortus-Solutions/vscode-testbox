/**
* The base model test case will use the 'model' annotation as the instantiation path
* and then create it, prepare it for mocking and then place it in the variables scope as 'model'. It is your
* responsibility to update the model annotation instantiation path and init your model.
*/
component extends="coldbox.system.testing.BaseModelTest" model="models.Calculator"{

    /*********************************** LIFE CYCLE Methods ***********************************/

    function beforeAll(){
        // setup the model
        super.setup();
        // init the model object
        model.init();
    }

    function afterAll(){
    }

    /*********************************** BDD SUITES ***********************************/

    function run(){

        describe( "Calculator", function(){

            it( "should be created", function(){
				expect( model ).toBeComponent();
            });

            it( "should add", function(){
				expect( model.add( 1, 3 ), 4 );
            });

            it( "should fail", function(){
				expect( model.bad( 1, 3 ), 4 );
            });


        });

    }

}
