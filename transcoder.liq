set("server.telnet", true)
set("init.allow_root", true)
set("log.file.path","/opt/transcoder-health-checker/cue-transcoder.log")
set("init.daemon", true)
set("init.daemon.pidfile.path","/opt/transcoder-health-checker/process.pid")

dyn_sources = ref []

def list.remove_assoc(label, l) =
  def f(result, element) =
    current_label = fst(element)
    if current_label == label then
      result
    else
      list.add(element,result)
    end
  end
  list.fold(f,[],l)
end

def add_source(uri) =
  keys = string.split(separator="-", uri)
  private = list.hd(default="null",keys)
  public = list.hd(default="null",list.tl(keys))
  url = mksafe(audio_to_stereo(input.http("http://stream.cue.dj:1337/#{private}")))
  source = output.icecast(
    %mp3(bitrate=128),
    mount="#{public}",
    host="transcoded.cue.dj",
    port=1337,
    password="willpaycryptoifhacked",
    fallible=true
  )

  output = source(url)

  dyn_sources :=
      list.append( [(public, output)],
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
  result = list.fold(search, ([]), !dyn_sources)
  dyn_sources := list.remove_assoc(uri, !dyn_sources)
  "#{result}"
end

server.register(namespace="sources",
                description="Start a transcoder.",
                usage="add priv-pub",
                "add",
                add_source)
server.register(namespace="sources",
                description="Stop a transcoder.",
                usage="remove priv",
                "remove",
                remove_source)

output.dummy(blank())
