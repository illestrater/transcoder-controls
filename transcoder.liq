set("server.telnet", true)

dyn_sources = ref []

def add_source(uri) =
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
  "transcoding #{uri}"
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
  "#{result}"
end

server.register(namespace="sources",
                description="Start a new dynamic playlist.",
                usage="add <uri>",
                "add",
                add_source)
server.register(namespace="sources",
                description="Start a new dynamic playlist.",
                usage="remove <uri>",
                "remove",
                remove_source)

output.dummy(blank())
