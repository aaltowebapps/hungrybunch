require 'sinatra'

set :public_folder, settings.root

get '/' do
  send_file 'poc_backbone_with_collection_from_localstorage.html'
end


