set("server.telnet", true)
set("log.file.path","/opt/transcoder-health-checker/cue-transcoder.log")
set("init.daemon", true)
set("init.daemon.pidfile.path","/opt/transcoder-health-checker/process.pid")

dyn_sources = ref []

def add_source(uri) =
  keys = string.split(separator="-", uri)
  private = list.hd(default="null",keys)
  public = list.tl(keys);
  url = mksafe(input.http("http://illestrater.com:1337/#{uri}"))
  source = output.icecast(
    %mp3(bitrate=128),
    mount="#{uri}-mp3",
    host="illestrater.com",
    port=1337,
    password="ethsavedmusic",
    fallible=true
  )

  output = source(url)

  dyn_sources := 
      list.append( [(uri, output)],
                    !dyn_sources )
  "transcoding #{private} #{public}"
end

def remove_source(uri) =
  def search(x, y) =
    current_uri = fst(y)
    if current_uri == uri then
      test = snd(y)
      source.shutdown(test)
      (["#{uri} closed"])
    else
      ([])
    end
  end
  dyn_sources := list.remove_assoc(uri, !dyn_sources)
  result = list.fold(search, ([]), !dyn_sources)
  "#{result}"
end

server.register(namespace="sources",
                description="Start a new dynamic playlist.",
                usage="add private-public",
                "add",
                add_source)
server.register(namespace="sources",
                description="Start a new dynamic playlist.",
                usage="remove private",
                "remove",
                remove_source)

output.dummy(blank())
