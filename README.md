# A TestBox Bundle v0.1.0 for Visual Studio Code

Get the latest Visual Studio Code from https://code.visualstudio.com/.

## Target Platforms
- TestBox 2.X.X

## Currently supported features

This bundle includes functionality for TestBox BDD/TDD and MockBox.

### Code Skeleton Snippets

- `bdd ➝` : Creates a TestBox BDD Bundle
- `unit ➝` : Creates a TestBox TDD xUnit Bundle

### TestBox Snippets

- `assert` : An `assert()` method
- `afterAll ➝` : An `afterAll()` BDD life-cycle method
- `aftereach ➝` : An `afterEach()` BDD closure
- `afterTests ➝` : An `afterTests()` xUnit life-cycle method
- `aroundEach ➝` : An `aroundEach()` BDD closure
- `bdd ➝` : Creates a new BDD Test Bundle CFC
- `beforeAll ➝` : An `beforeAll()` BDD life-cycle method
- `beforeeach ➝` : A `beforeEach()` BDD closure
- `beforeTests ➝` : An `beforeTests()` xUnit life-cycle method
- `console ➝` : TestBox send some output to the console
- `debug ➝` : Writes up a non-duplicate `debug()` call
- `debugduplicate ➝` : Writes up a `debug()` call with duplicate
- `describe ➝` : A `describe` suite
- `describeFull ➝` : A `describe` suite with all arguments
- `expect ➝` : Starts an expectation DSL with a `toBe()` addition
- `expectAll ➝` : Starts a collection expectation DSL with a `toBe()` addition
- `expectFalse ➝` : Does a false expectation expression
- `expectTrue ➝` : Does a true expectation expression
- `expectToThrow ➝` : Starts an expectation that throws an exception
- `feature, featureFull ➝` : Starts a `feature()` block
- `given, givenFull ➝` : Starts a `given()` block
- `it ➝` : A test spec
- `itFull ➝` : A test spec with all arguments
- `setup ➝` : An `setup()` xUnit life-cycle method
- `story, storyFull ➝` : Starts a `story()` block
- `teardown ➝` : An `teardown()` xUnit life-cycle method
- `then, thenFull ➝` : Starts a `then()` block
- `unit ➝` : Creates a new xUnit Test Bundle CFC
- `when, whenFull ➝` : Starts a `when()` block 

### ColdBox Testing Snippets

- `handlerTest ➝` : Creates a ColdBox Event Handler test case
- `integration ➝` : Creates a top down integration BDD test case
- `interceptorTest ➝` : Creates an Interceptor test case
- `modelTest ➝` : Creates a model test case
- `testaction ➝` : Creates an integration spec case for an event action

## Installation instructions : 

### With Package Control ###

Install the latest *vscode-testbox* package from https://marketplace.visualstudio.com/.

## References:

- A ColdBox Platform Bundle v2.0.0 for Sublime Text 2/3 - https://github.com/lmajano/cbox-coldbox-sublime
