@REM ----------------------------------------------------------------------------
@REM Maven wrapper script for Windows
@REM ----------------------------------------------------------------------------
@echo off
set MAVEN_WRAPPER_JAR=%~dp0.mvn\wrapper\maven-wrapper.jar
set MAVEN_WRAPPER_PROPERTIES=%~dp0.mvn\wrapper\maven-wrapper.properties

if not exist "%MAVEN_WRAPPER_JAR%" (
    echo Downloading Maven wrapper...
    curl -s -o "%MAVEN_WRAPPER_JAR%" "https://repo.maven.apache.org/maven2/org/apache/maven/wrapper/maven-wrapper/3.2.0/maven-wrapper-3.2.0.jar"
)

java -jar "%MAVEN_WRAPPER_JAR%" %*
