
clean:
    hugo mod clean
    rm -fr build_dir

run:  clean
    hugo server --navigateToChanged -DF -d build_dir
