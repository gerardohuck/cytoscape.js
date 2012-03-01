# executables -- change these as needed to correspond to where these are on your system
YUI = java -jar yuicompressor-2.4.6.jar
YUIFLAGS = --line-break 500
RM = rm -rf
CAT = cat
CP = cp -R
ZIP = zip
MV = mv
PRINTF = printf
SED = sed
MKDIR = mkdir
CD = cd
PWD = pwd

# version (update this when building release zip)
VERSION = snapshot-$(shell date +%Y.%m.%d-%H.%M.%S)

# targets (add scripts here to add to the release zip)
DEPENDENCIES_DIR = lib
DEPENDENCIES = lib/jquery.color.js lib/jquery.svg.js lib/2D.js lib/jquery.mousewheel.js
LIB = jquery.cytoscapeweb.core.js jquery.cytoscapeweb.renderer.null.js jquery.cytoscapeweb.renderer.svg.js jquery.cytoscapeweb.layout.null.js jquery.cytoscapeweb.layout.random.js jquery.cytoscapeweb.layout.grid.js jquery.cytoscapeweb.layout.preset.js
EXTRAS = jquery.cytoscapeweb.layout.arbor.js jquery.cytoscapeweb.layout.springy.js jquery.cytoscapeweb-panzoom.js jquery.cytoscapeweb-panzoom.css

# names of the cytoscape web release js files
JS_W_DEPS_FILE = $(BUILD_DIR)/jquery.cytoscapeweb.all.js
JS_WO_DEPS_FILE = $(BUILD_DIR)/jquery.cytoscapeweb.js
MIN_JS_W_DEPS_FILE = $(JS_W_DEPS_FILE:%.js=%.min.js)
MIN_JS_WO_DEPS_FILE = $(JS_WO_DEPS_FILE:%.js=%.min.js)
MIN_EXTRAS = $(EXTRAS:%.js=$(BUILD_DIR)/%.min.js)
BUILD_EXTRAS = $(EXTRAS:%=$(BUILD_DIR)/%)

# configure what files to include in the zip
ZIP_FILE = $(BUILD_DIR)/jquery.cytoscapeweb-$(VERSION).zip
ZIP_CONTENTS = $(JS_W_DEPS_FILE) $(MIN_JS_W_DEPS_FILE) $(JS_WO_DEPS_FILE) $(MIN_JS_WO_DEPS_FILE) $(MIN_EXTRAS) $(BUILD_EXTRAS) $(DEPENDENCIES_DIR) $(LICENSE) $(README)
BUILD_DIR = build
ZIP_DIR = jquery.cytoscapeweb-$(VERSION)
LICENSE = LGPL-LICENSE.txt
PREAMBLE = PREAMBLE
README = README

# temp stuff
TEMP = $(BUILD_DIR)/temp
TEMPFILE = $(TEMP)/temp-file
CWD = `$(PWD)`

all : zip

zip : $(ZIP_CONTENTS) $(ZIP_FILE)
	
minify : $(MIN_JS_W_DEPS_FILE) $(MIN_JS_WO_DEPS_FILE) $(BUILD_DIR) $(BUILD_EXTRAS)

$(ZIP_DIR) : minify
	$(RM) $(ZIP_DIR)
	$(MKDIR) $(ZIP_DIR)
	$(CP) $(ZIP_CONTENTS) $(ZIP_DIR)

$(ZIP_FILE) : $(ZIP_DIR)
	$(ZIP) -r $(ZIP_FILE) $(ZIP_DIR)
	$(RM) $(ZIP_DIR)

$(JS_W_DEPS_FILE) : $(BUILD_DIR)
	$(CAT) $(DEPENDENCIES) $(LIB) > $@
	$(SED) "s/VERSION/${VERSION}/g" $(PREAMBLE) | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@
	$(PRINTF) "\n/* $(@F) */\n\n" | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@

$(JS_WO_DEPS_FILE) : $(BUILD_DIR)
	$(CAT) $(LIB) > $@
	$(SED) "s/VERSION/${VERSION}/g" $(PREAMBLE) | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@
	$(PRINTF) "\n/* $(@F) */\n\n" | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@

$(BUILD_EXTRAS) : $(BUILD_DIR)
	$(CP) $(@:$(BUILD_DIR)/%=%) $@
	$(SED) "s/VERSION/${VERSION}/g" $(PREAMBLE) | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@
	$(PRINTF) "\n/* $(@F) */\n\n" | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@

$(BUILD_DIR) :
	$(MKDIR) $@
	$(MKDIR) $(TEMP)

# rule for minifying a .js file to a .min.js file
%.min.js : %.js
	$(YUI) $(YUIFLAGS) $? -o $@
	$(SED) "s/VERSION/${VERSION}/g" $(PREAMBLE) | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@
	$(PRINTF) "\n/* $(@F) */\n\n" | $(CAT) - $@ > $(TEMPFILE) && $(MV) $(TEMPFILE) $@

clean : 
	$(RM) $(BUILD_DIR)